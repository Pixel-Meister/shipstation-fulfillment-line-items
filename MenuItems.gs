function sideMenu() {
  let html = HtmlService.createHtmlOutputFromFile("sidebar");
  ui.showModalDialog(html,"Enter date range");
}

function clearToken(){
  let response = ui.alert("Are you sure you want to clear your authentication token?",ui.ButtonSet.YES_NO);
    if(response == ui.Button.YES) {
      properties.deleteProperty("ApiAuth");
    }
}
function authenticateScript() {
  function promptInfo() {
    ui.showModalDialog(HtmlService.createHtmlOutputFromFile("authPrompt"),"Authentication Info");
  }
  if(properties.getProperty("ApiAuth")) {
    let response = ui.alert("Authentication has previously been entered. Are you sure you want to continue?",ui.ButtonSet.YES_NO);
    if(response == ui.Button.YES) {
      promptInfo();
    } else if(response == ui.Button.NO) {
    console.log("user clicked no");
    return;
  } 
} else {
  promptInfo();
}
}

let submit = submission => {
  let encryptedSubmission = `Basic ${Utilities.base64Encode(submission)}`;
  properties.setProperty("ApiAuth",encryptedSubmission);
  return;
}
