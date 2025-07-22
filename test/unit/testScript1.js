var mess = new sn_ws.RESTMessageV2();
mess.setHttpMethod("GET");
mess.setEndpoint("https://www.servicenow.com");
mess.setLogLevel("all");
var resp = mess.execute();
gs.info(resp.getStatusCode());