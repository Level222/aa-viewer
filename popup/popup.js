(async () => {
  "use strict";

  const fonts = await (await fetch("/fonts.json")).json();

  const targetTab = (await chrome.tabs.query({currentWindow: true, active: true}))[0];
  if (!/^(https?|file|localhost):/.test(targetTab.url)) {
    document.write(`このページではお使いいただけません`);
    return;
  }

  const targetTabId = targetTab.id;

  let currentFont = (await chrome.storage.local.get("font")).font || "aahub_light4";

  const textOutputArea = document.querySelector("#text-output"),
        imageOutputArea = document.querySelector("#image-output"),
        fontFaceStyle = document.querySelector("#font-face"),
        fontSelect = document.querySelector("#font"),
        pageFontCheckbox = document.querySelector("#page-font");

  const formatBytes = bytes => {
    const prefixes = "KMGTPEZYRQ";
    let n = Math.max(bytes, 0) || 0,
        i = 0;
    while (i++ < prefixes.length && n >= 1024) n /= 1024;
    return `${n.toFixed(1)}${prefixes.charAt(i - 2)}B`;
  };

  fonts.forEach(({name, size}) => {
    fontSelect.add(new Option(`${name}(${formatBytes(size)})`, name));
  });
  fontSelect.value = currentFont;




  const ObjectMap = (obj, callback) => Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, callback(value, key, obj)])
  );

  const fontFaces = Object.fromEntries(fonts.map(({name, base64}) => [name,
`@font-face {
  font-family: "_current_aahub_font";
  src: url("data:font/woff2;base64,${base64}") format("woff2");
  font-display: swap;
}`
  ]));


  const getSelectedText = async () => (await chrome.scripting.executeScript({
    target: {tabId: targetTabId},
    func: () => getSelection().toString()
  }))[0].result;

  textOutputArea.textContent = await getSelectedText() ||
` ∧＿∧　　／￣￣￣￣￣
（　´∀｀）＜　選択シテナイカモナー
（　　　　） 　＼＿＿＿＿＿
｜ ｜　|
（_＿）＿）`;

  const setImage = () => {
    fontFaceStyle.textContent = fontFaces[currentFont];
    textOutputArea.classList.remove("hidden");
    imageOutputArea.classList.add("hidden");

    domtoimage.toPng(textOutputArea)
      .then(src => {
        if (src === "data:,") throw "Empty DataURL";
        const img = new Image();
        img.src = src;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = src;
        downloadAnchor.download = "aa-image";
        downloadAnchor.append(img);
        return downloadAnchor;
      })
      .catch(() => `画像化に失敗しました`)
      .then(newImage => {
        imageOutputArea.replaceChildren(newImage);
        textOutputArea.classList.add("hidden");
        imageOutputArea.classList.remove("hidden");
      });
  }



  const pageCSSs = ObjectMap(fontFaces, fontFace =>
    `${fontFace} * { font-family: "_current_aahub_font" !important; }`
  );

  const addFontPage = () => chrome.scripting.insertCSS({
    target: {tabId: targetTabId},
    css: pageCSSs[currentFont]
  });

  const removeFontPage = css => chrome.scripting.removeCSS({
    target: {tabId: targetTabId},
    css: css
  });

  const removeAllFontPage = () => Promise.all(Object.values(pageCSSs).map(css => removeFontPage(css)));

  pageFontCheckbox.addEventListener("change", async () => {
    await removeAllFontPage();
    if (pageFontCheckbox.checked) await addFontPage();
  });

  const setFont = async () => {
    currentFont = fontSelect.value;
    chrome.storage.local.set({font: currentFont});
    setImage();
    pageFontCheckbox.checked = true;
    await removeAllFontPage();
    await addFontPage();
  };

  setFont();
  fontSelect.addEventListener("change", setFont);
})();