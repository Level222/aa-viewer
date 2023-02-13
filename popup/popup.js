(async () => {
  "use strict";

  const targetTab = (await chrome.tabs.query({currentWindow: true, active: true}))[0];
  // Return if the URL scheme is not supported.
  if (!/^(https?|file|localhost):/.test(targetTab.url)) {
    document.write(`このページではお使いいただけません`);
    return;
  }

  const targetTabId = targetTab.id;

  const storage = (await chrome.storage.local.get(["currentFont", "fonts"]));
  const {fonts} = storage;
  let {currentFont} = storage;

  const textOutputArea = document.querySelector("#text-output"),
        imageOutputArea = document.querySelector("#image-output"),
        fontFaceStyle = document.querySelector("#font-face"),
        fontSelect = document.querySelector("#font"),
        downloadAnchor = document.querySelector("#download"),
        pageFontCheckbox = document.querySelector("#page-font");

  const formatBytes = bytes => {
    const prefixes = "KMGTPEZYRQ";
    let n = Math.max(bytes, 0) || 0,
        i = 0;
    while (i++ < prefixes.length && n >= 1024) n /= 1024;
    return `${n.toFixed(1)}${prefixes.charAt(i - 2)}B`;
  };

  const resizeSelect = select => {
    const options = [...select.options];
    options.forEach(option => {
      if (!option.selected) option.remove();
    });
    select.style.width = "auto";
    select.style.width = `${select.offsetWidth}px`;
    select.replaceChildren(...options);
  };

  // Set font selector.
  fontSelect.append(...fonts.map(
    ({fontName, size}) => new Option(`${fontName}(${formatBytes(size)})`, fontName)
  ));
  fontSelect.value = currentFont;
  resizeSelect(fontSelect);




  const ObjectMap = (obj, callback) => Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, callback(value, key, obj)])
  );

  const fontFaces = Object.fromEntries(fonts.map(({fontName, fileName}) => [fontName,
`@font-face {
  font-family: "__current_aa_font";
  src: url("${chrome.runtime.getURL(`fonts/${fileName}`)}") format("woff2");
  font-display: swap;
}`
  ]));


  const getSelectedText = async () => (await chrome.scripting.executeScript({
    target: {tabId: targetTabId},
    func: () => getSelection().toString()
  }))[0].result;

  // Set target AA.
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
    downloadAnchor.classList.add("disabled");

    domtoimage.toPng(textOutputArea)
      .then(src => {
        if (src === "data:,") throw "Empty DataURL";
        const img = new Image();
        img.src = src;
        downloadAnchor.href = src;
        downloadAnchor.classList.remove("disabled");
        return img;
      })
      .catch(() => {
        downloadAnchor.removeAttribute("href");
        return `画像化に失敗しました`;
      })
      .then(newImage => {
        imageOutputArea.replaceChildren(newImage);
        textOutputArea.classList.add("hidden");
        imageOutputArea.classList.remove("hidden");
      });
  }



  const pageCSSs = ObjectMap(fontFaces, fontFace =>
    `${fontFace} * { font-family: "__current_aa_font" !important; }`
  );

  const addFontToPage = () => chrome.scripting.insertCSS({
    target: {tabId: targetTabId},
    css: pageCSSs[currentFont]
  });

  const removeFontFromPage = css => chrome.scripting.removeCSS({
    target: {tabId: targetTabId},
    css: css
  });

  const removeAllFontsFromPage = () => Promise.all(
    Object.values(pageCSSs).map(css => removeFontFromPage(css))
  );

  pageFontCheckbox.addEventListener("change", async () => {
    await removeAllFontsFromPage();
    if (pageFontCheckbox.checked) await addFontToPage();
  });

  const setFont = async () => {
    currentFont = fontSelect.value;
    chrome.storage.local.set({currentFont});
    setImage();
    pageFontCheckbox.checked = true;
    await removeAllFontsFromPage();
    await addFontToPage();
  };

  setFont();
  fontSelect.addEventListener("change", () => {
    setFont();
    resizeSelect(fontSelect);
  });
})();