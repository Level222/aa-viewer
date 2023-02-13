chrome.runtime.onInstalled.addListener(async () => {
  const currentSettings = await chrome.storage.local.get(["currentFont", "autoInsertList"]);

  chrome.storage.local.set({
    fonts: [
      {
        fontName: "aahub",
        size: 1365864,
        fileName: "aahub.woff2"
      },
      {
        fontName: "aahub_light",
        size: 44960,
        fileName: "aahub_light.woff2"
      },
      {
        fontName: "aahub_light4",
        size: 172104,
        fileName: "aahub_light4.woff2"
      },
      {
        fontName: "monapo",
        size: 1340528,
        fileName: "monapo.woff2"
      },
      {
        fontName: "Saitamaar",
        size: 407684,
        fileName: "Saitamaar.woff2"
      },
      {
        fontName: "saitamaar_light",
        size: 74832,
        fileName: "saitamaar_light.woff2"
      },
      {
        fontName: "RobotoJAA-regular",
        size: 2245584,
        fileName: "RobotoJAA-regular.woff2"
      },
      {
        fontName: "RobotoJAA-medium",
        size: 2312276,
        fileName: "RobotoJAA-medium.woff2"
      },
      {
        fontName: "monaya",
        size: 1039404,
        fileName: "monaya.woff2"
      }
    ],
    currentFont: currentSettings.currentFont ?? "aahub_light4",
    autoInsertList: currentSettings.autoInsertList ?? []
  });
});