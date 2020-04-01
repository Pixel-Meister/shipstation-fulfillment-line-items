/*function testbaybee () {
  var bleep = [];
  bleep = getPages(1,2,"/orders", minusMonthsDate("01/01/2020",12), formattedDate("01/31/2020"));
  console.log(bleep.length);
  var bloop = [];
  bloop = getPages(1,2,"/fulfillments", formattedDate("01/01/2020"), formattedDate("01/31/2020"));
  appendDataToSheet(bloop, bleep);
}*/
function formattedDate (string) {
  var newDate = new Date(string).toISOString();
  return newDate;
}
function minusMonthsDate (string, months) {
  var start = new Date(string);
  start.setTime(start.getTime() - 1000*60*60*24*30*months)
  var newOldDate = start.toISOString();
  return newOldDate;
}

function getPages (page, pageNum,endpoint, dateStart, dateEnd) {
  var tempJSON;
  var returnJSON = [];
  var endpointSubstring = endpoint.substring(1);
  while (page <= pageNum) {
    tempJSON = getShipstationData(endpoint,"?shipDateStart=" + dateStart + "&shipDateEnd=" + dateEnd + "&pageSize=500" + "&page=" + page);
    returnJSON = returnJSON.concat(tempJSON[endpointSubstring]);
    pageNum = tempJSON.pages;
    page = Number(tempJSON.page) + 1;
    }
  return returnJSON
  }

function onOpen() {
  SpreadsheetApp.getUi()
  .createMenu("Shipstation Fulfillments")
  .addItem("Select months", "promptRange")
  .addToUi();
}

function promptRange () {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "Enter shipped date date range seperated with -",
    "For example: 01/01/2020-01/31/2020",
    ui.ButtonSet.OK_CANCEL);
  
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  var dateArray = [];
  if (button == ui.Button.OK && text != (false || null)) {
    var fulfillmentJSON = [];
    var ordersJSON = [];
    dateArray = text.trim().split('-');
    fulfillmentJSON = getPages(1,2,"/fulfillments", formattedDate(dateArray[0]), formattedDate(dateArray[1]));
    ordersJSON = getPages(1,2,"/orders", minusMonthsDate(text[0],12), formattedDate(dateArray[1]));
    appendDataToSheet(fulfillmentJSON, ordersJSON);
  } else if (button == ui.Button.CANCEL) {
    console.log("User hit cancel");
  } else if (button == ui.Button.CLOSE) {
    console.log("User hit close");
  } else if (button == ui.Button.OK && (text == (null || false) || text.indexOf('-') < 0)) {
    ui.alert("Did you include '-' to seperate start and end dates? Or did you not put a date in?");
  } else {ui.alert("You did something unpredictable. Let Justin know what you were doing to get this alert :)");}
}

function getShipstationData(endpoint, filters) {
  var root = 'ssapi.shipstation.com';
  var params = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'Basic MzNkZWVhNzljMThlNDZjODhlNTI2ZmNiNjIzNjQ2MGQ6MDJhZTQ2NjdkMDhiNDZmNzgwYmZhMDFhNTI0ZWFjNjI='
    }
  };
  
  var response = UrlFetchApp.fetch(root+endpoint+filters, params);
  var data = response.getContentText();
  return JSON.parse(data);
}

function appendDataToSheet(fulfillmentJSON, ordersJSON) {
  var orderIds = [];
  var ordersLen = ordersJSON.length;
  var k = 0;
  for (k; k < ordersLen; k++) {
    orderIds.push(ordersJSON[k]["orderId"]);
  }
  var fulfillmentLen = fulfillmentJSON.length;
  var i = 0
  for (i; i < fulfillmentLen ; i++) {
    var j = 0;
    var itemsLen = ordersJSON[orderIds.indexOf(fulfillmentJSON[i].orderId)].items.length;
    var totalItems = 0;
    for (j; j < itemsLen; j++) {      
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheets()[0];
      sheet.appendRow([fulfillmentJSON[i].orderNumber,
                       fulfillmentJSON[i].orderId,
                       fulfillmentJSON[i].createDate,
                       fulfillmentJSON[i].shipDate,
                       ordersJSON[orderIds.indexOf(fulfillmentJSON[i].orderId)].items[j].name,
                       ordersJSON[orderIds.indexOf(fulfillmentJSON[i].orderId)].orderTotal,
                       fulfillmentJSON[i].shipTo.name,
                       ordersJSON[orderIds.indexOf(fulfillmentJSON[i].orderId)].items[j].sku,
                       ordersJSON[orderIds.indexOf(fulfillmentJSON[i].orderId)].items[j].quantity                      
                      ]);
    }
  }
}
