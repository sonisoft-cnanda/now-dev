Install Plugin:
POST https://dev256787.service-now.com/api/sn_cicd/plugin/{plugin_id}/activate

Install App From Repo:

POST https://dev256787.service-now.com/api/sn_cicd/app_repo/install

Prepare request
Query parameters
NameValueDescription
sys_id
The unique sys_id of the application (sys_id or scope required)
scope
The scope of the application
version
The version of the application
auto_upgrade_base_app
Auto upgrade the base application if it is true
base_app_version
Version of the base application


Publish Application:
Publish an application to the App Repo
POST https://dev256787.service-now.com/api/sn_cicd/app_repo/publish

Prepare request
Query parameters
NameValueDescription
sys_id
The unique sys_id of the application (sys_id or scope required)
scope
The scope of the application
version
The version of the application
dev_notes
The release notes


Rollback an application to prior version
POST https://dev256787.service-now.com/api/sn_cicd/app_repo/rollback

Prepare request
Query parameters
NameValueDescription
sys_id
The unique sys_id of the application (sys_id or scope required)
scope
The scope of the application
version
The expected version after rollback




Store Apps:

Install Application
GET https://dev256787.service-now.com/api/sn_appclient/appmanager/app/install

Prepare request
Query parameters
NameValueDescription
app_id
source app id of the application
customization_version
customization version
load_demo_data
flag to load demo data
version
version of an app



Repair Application
GET https://dev256787.service-now.com/api/sn_appclient/appmanager/app/repair

Prepare request
Query parameters
NameValueDescription
version
version of an app
customization_version
customization version
load_demo_data
flag to load demo data
app_id
source app id of the application


Update Application
GET https://dev256787.service-now.com/api/sn_appclient/appmanager/app/update

Prepare request
Query parameters
NameValueDescription
load_demo_data
flag to load demo data
version
version of an app
app_id
source app id of the application
customization_version
customization version

GetApps
POST https://dev256787.service-now.com/api/sn_appclient/appmanager/apps

Prepare request
Query parameters
NameValueDescription
sysparm_offset
Number of records to skip from the response
search_key
search criteria
sysparm_limit
1 (Limited to 1 result for testing)
The maximum number of results returned per page (default: 10,000)
tab_context
Valid options:- 1. available_for_you 2. installed 3. updates




Install Product
POST https://dev256787.service-now.com/api/sn_appclient/appmanager/product/install

Prepare request
Query parameters
Request headers
NameValueDescription
Request format
application/json
Format of REST request body
Response format
application/json
Format of REST response body
Authorization
Send as me
Send the request as the current user. To send the request with another user’s credentials use the provided code samples, such as cURL.


GetProducts - API to fetch all the products
POST https://dev256787.service-now.com/api/sn_appclient/appmanager/products

Prepare request
Query parameters
NameValueDescription
sysparm_offset
Number of records to skip from the response
sysparm_limit
1 (Limited to 1 result for testing)
The maximum number of results returned per page (default: 10,000)
search_key
search criteria


GetAllQueuedInstallations - API to list all inprogress installations
GET https://dev256787.service-now.com/api/sn_appclient/appmanager/installations

Prepare request
Query parameters
NameValueDescription
sysparm_limit
1 (Limited to 1 result for testing)
The maximum number of results returned per page (default: 10,000)
sysparm_offset
Number of records to skip from the response


GetQueuedInstallationByTrackerId - API to list all inprogress installations
GET https://dev256787.service-now.com/api/sn_appclient/appmanager/installations/{trackerId}

Prepare request
Path parameters
NameValue
trackerId
trackerId




CICD Batch Install API
CI/CD service to install a plan via the batch installer
Install a set of applications and plugins based on installation plan
POST https://dev256787.service-now.com/api/sn_cicd/app/batch/install


CICD Batch Install API
CI/CD service to install a plan via the batch installer
Get the results of a batch install plan
GET https://dev256787.service-now.com/api/sn_cicd/app/batch/results/{result_id}

Prepare request
Path parameters
NameValue
result_id
result_id