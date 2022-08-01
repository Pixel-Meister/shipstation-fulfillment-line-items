var properties = PropertiesService.getScriptProperties();
var ui = SpreadsheetApp.getUi();

function log() {
  onCall("2022-01-01 23:59:59","2022-01-31 23:59:59");
  //console.log(properties.getProperty("shippingFulfillment"));
}

function onOpen() {
  ui.createMenu("Shipstation Picker")
  .addItem("Select date range","sideMenu")
  //.addItem("Test","log")
  .addSubMenu(ui.createMenu("API Authentication")
    .addItem("Enter API token","authenticateScript")
    .addItem("Clear API token","clearToken")
  ).addToUi();
}

function post(url) {
  let params = {
  "method" : "GET",
  muteHttpExceptions : false,
  headers : {
    //"Host": 'ssapi.shipstation.com',
    "Authorization": properties.getProperty("ApiAuth")
    }
  };
  let response = UrlFetchApp.fetch(url,params);
  let data = response.getContentText();
  //console.log(data);
  return JSON.parse(data);
}

function getData(endpoint, params, results = [], page = 1) {
  let url = `https://ssapi.shipstation.com/${endpoint}?pageSize=500&page=${page}&${params}`;
  //console.log(url);
  let returnObject = post(url);
  results.push(...returnObject[endpoint]);
  //console.log(returnObject.fulfillments);
  //console.log(results.length);
  //console.log(returnObject.page);
  //console.log(returnObject.pages);
  //console.log(returnObject.page < returnObject.pages);
  if(returnObject.page < returnObject.pages) {
    getData(endpoint,startDate,endDate, results, returnObject.page + 1)
  }
  return results;
}

function onCall (startDate,endDate){
  let shippingFulfillments = [];
  shippingFulfillments.push(...getData("fulfillments",`shipDateStart=${startDate}&shipDateEnd=${endDate}`));
  shippingFulfillments.push(...getData("shipments",`shipDateStart=${startDate}&shipDateEnd=${endDate}`));
  console.log("Completed orders: " + shippingFulfillments.length);
  let orderInfo = [];
  
  let modifyStart = new Date(startDate);
  modifyStart.setMonth(modifyStart.getMonth() - 1);
  modifyStart  = modifyStart.toISOString().substring(0,10);

  let modifyEnd = new Date(endDate);
  modifyEnd.setMonth(modifyEnd.getMonth() + 1);
  modifyEnd  = modifyEnd.toISOString().substring(0,10);
  
  orderInfo.push(...getData("orders",`modifyDateStart=${modifyStart}&modifyDateEnd=${modifyEnd}&orderStatus=shipped`))
  console.log("Orders: " + orderInfo.length);
  updateSheet(shippingFulfillments,orderInfo);
  return "Success!"
}

function updateSheet(completedOrders = [], orders = []) {
  const completedOrdersIds = completedOrders.map(order => order.orderId);
  const filteredOrders = orders.filter(order => completedOrdersIds.indexOf(order.orderId) != -1)
  let pushArray = [];
  pushArray.push(["Order Number", "Order ID", "Order Date", "Ship Date", "Description", "Order Total", "Name", "SKU", "Item Quantity", "Shipping Country"]);
  console.log(`Filtered ${orders.length - filteredOrders.length} orders for missing items`);
  filteredOrders.forEach(order => {
    console.log(order);
    order.items.forEach(item => {
      console.log(item);
      pushArray.push([order.orderNumber,
                       order.orderId,
                       order.createDate,
                       order.shipDate,
                       item.name,
                       order.orderTotal,
                       order.shipTo.name,
                       item.sku,
                       item.quantity,
                       order.shipTo.country
                      ])
    })
  })

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.clear();
  sheet.getRange(1, 1, pushArray.length, pushArray[0].length).setValues(pushArray);
  console.log(`pushArray length: ${pushArray.length} and pushArray 0 length ${pushArray[0].length}`);
  return "Success!"
}
