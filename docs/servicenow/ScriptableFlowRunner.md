Version: zurich

## API Reference - Server Side Scoped

ServiceNow provides JavaScript APIs for use within scripts running on the ServiceNow platform to deliver common functionality. This reference lists available classes and methods along with parameters, descriptions, and examples to make extending the ServiceNow platform easier.

**Please note:** The APIs below are intended for scoped applications and may behave differently in the global scope.

# ScriptableFlowRunner

Creates a builder object used to define parameters for flow, subflow, and action execution. You can specify a flow to execute in a particular domain. Start the flow, subflow, or action execution
directly from the builder and view the results in a ScriptableFlowRunnerResult object.

Use these methods in your server-side scripts with the `sn_fd` namespace
identifier.

## API call order

Build and execute flows, subflows, and actions using these APIs in the following order:

1\. FlowAPI: Creates a builder objectUse getRunner() to instantiate the ScriptableFlowRunner
builder object.2\. ScriptableFlowRunner: Specify Workflow Studio content to runUse these methods in the following order to create the builder pattern:

1. Use one of the methods action(),
    datastream(), flow(), or
    subflow() to specify what type of Workflow Studio object to build.
2. Use one or more methods such as addInput(),
    inDomain(), or quick() to
    specify execution parameters.
3. Use the run() method to run the action, flow, or
    subflow with the provided parameters and return a
    ScriptableFlowRunnerResult object.

3\. ScriptableFlowRunnerResult: Retrieve Workflow Studio execution detailsUse one or more methods such as getContextId(),
getOutputs(), and getDomainId() to
view execution details.

## Example

This example shows how to create a
ScriptableFlowRunner builder object and uses it to execute an approval action on a
specific record. A ScriptableFlowRunnerResult object captures the execution
arguments and action outputs.

```javascript

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```

## action(String scopedActionName)

Identifies the scope and name of the action to execute.

See also:

- [ScriptableFlowRunner - flow(String scopedFlowName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-flow_S "Identifies the scope and name of the flow to execute.")
- [ScriptableFlowRunner - subflow(String scopedSubflowName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-subflow_S "Identifies the scope and name of the subflow to execute.")

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| scopedActionName | String | Scope and name of the action to execute. For example,<br> `global.actionName`. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to create a
ScriptableFlowRunner builder object and uses it to execute an approval action on a
specific record. A ScriptableFlowRunnerResult object captures the execution
arguments and action outputs.

```

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```

## addInput(String name, Object value)

Adds a single input. If the name passed as an argument already exists as a separate
input, the new value replaces the pre-existing value.

This method adds a single input. To create an object and add multiple inputs, use the
withInputs() method.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| name | String | The name of the input for the flow, subflow, or action. |
| value | Object | The value of the input for the flow, subflow, or action. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This runs an action that takes a single input called
`table_name`.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .action('global.test_action')
      .addInput('table_name', 'incident')
      .inForeground()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
Flow Designer: TableName
*** Script: FlowRunnerResult
Flow Object Name: global.test_action
Flow Object Type: action
Domain: null
Result Time: 2020-06-09 00:10:57
ContextId: null
count: 1
```

## datastream(String scopedDatastreamName)

Identifies the scope and name of the data stream action to execute.

To learn more about data stream actions, see Data Stream actions and
pagination.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| scopedDatastreamName | String | Scope and name of the Data Stream action to execute. For example,<br> `global.dataStreamActionName`. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a Data Stream action.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .datastream('global.test_dsa')
      .inForeground()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
*** Script: FlowRunnerResult
Flow Object Name: global.test_dsa
Flow Object Type: datastream
Domain: null
Result Time: 2020-06-08 16:41:13
ContextId: null
count: 0
```

## flow(String scopedFlowName)

Identifies the scope and name of the flow to execute.

See also:

- [ScriptableFlowRunner - action(String scopedActionName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-action_S "Identifies the scope and name of the action to execute.")
- [ScriptableFlowRunner - subflow(String scopedSubflowName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-subflow_S "Identifies the scope and name of the subflow to execute.")

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| scopedFlowName | String | Scope and name of the flow to execute. For example,<br> `global.flowName`. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a flow that logs a message.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .flow('global.test_flow')
      .inForeground()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
*** Script: FlowRunnerResult
Flow Object Name: global.test_flow
Flow Object Type: flow
Domain: null
Result Time: 2020-06-08 16:41:13
ContextId: null
count: 0
```

## inBackground()

Runs the flow, subflow, or action asynchronously. Once the flow object starts running,
script execution resumes immediately.

Note: As of the Xanadu release, running an action, flow, or subflow in the background using the quick() method returns an execution ID as the ContextId value. The execution ID is not an actual context record as no records
are inserted into the Flow Context \[sys\_flow\_context\] table. Rather the execution ID is used to track the asynchronous call.

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a flow in the background asynchronously.

```
(function() {
    try {

      var result = sn_fd.FlowAPI.getRunner()
        .flow('global.change__unauthorized__review')
        .inBackground()
        .run();

      gs.info(result.debug());

    } catch (ex) {
      var message = ex.getMessage();
      gs.error(message);
    }

  })();
```

```
[0:00:01.015] Script completed in scope global: script
––––––––––––––––––––––––––––––––––––––––––––––––––––--
Script execution history and recovery available here
Operation       Table                               Row Count
insert          sys_flow_context_inputs_chunk       1
insert          sys_flow_context                    1
––––––––––––––––––––––––––––––––––––––––––––––––––––--
Complex type redefined: FlowDesigner:FDCollection
Queued flow.fire event in NowMQ for sys_flow_context.sys_id: e0cd6e30b8b602104a8752ad4a9167c8,
sysevent.sys_id: 34cd6e30dbb60210497c1a48139619c9, with priority 5
*** Script: FlowRunnerResult
Flow Object Name: global.change__unauthorized__review
Flow Object Type: flow
Domain: null
Result Time: 2024-06-12 17:54:58
ContextId: e0cd6e30b8b602104a8752ad4a9167c8
count: 0
```

## inDomain(String domainId)

Runs the flow, subflow, or action in the specified domain. Checks to ensure the domain
exists and is available.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| domainId | String | The sys\_id or name for the domain of execution for the flow. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to create a
ScriptableFlowRunner builder object and uses it to execute an approval action on a
specific record. A ScriptableFlowRunnerResult object captures the execution
arguments and action outputs.

```

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```

## inForeground()

Runs the flow, subflow, or action synchronously. Script execution pauses while the flow
object is running.

Note:This method does not support pausing the action to wait
for conditions. Steps that pause for wait conditions such as Ask for Approval or Wait
for Condition are not supported.

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to create a
ScriptableFlowRunner builder object and uses it to execute an approval action on a
specific record. A ScriptableFlowRunnerResult object captures the execution
arguments and action outputs.

```

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```

## quick()

Runs a flow, subflow, action, or Data
Stream action from a server-side script synchronously or asynchronously without
creating execution details or other related records. Improves performance by
eliminating record-keeping overhead.Use this API to increase the speed of high-volume processing, for
example multiple executions per second, in a production environment.

Reporting & records generatedThis method does not create execution details and context records, regardless of Workflow Studio settings.Wait condition supportThis method does not support pausing an action or flow to wait for conditions. Actions,
flow logic, and steps that pause for wait conditions such as Ask for Approval, Wait for
Condition, or Wait for a duration are not supported.MID Server supportThis method does not support pausing an action or flow to run from a MID Server. This
restriction includes data stream action preprocessing scripts that pause an action to run
from a MID Server.Data stream action supportThis method does not support pausing a data stream action to run a preprocessing script
from a MID Server.Flow priority supportThis method supports flow priority settings. The flow runs at the specified flow priority.

Note: As of the Xanadu release, running an action, flow, or subflow in the background using the quick() method returns an execution ID as the ContextId value. The execution ID is not an actual context record as no records
are inserted into the Flow Context \[sys\_flow\_context\] table. Rather the execution ID is used to track the asynchronous call.

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a flow without creating any related records.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .flow('global.change__unauthorized__review')
      .inBackground()
      .quick()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
Complex type redefined: FlowDesigner:FDCollection
Queued flow.run.quick event in NowMQ for sys_flow_context.sys_id: d81781ec57801110403e8f90ac94f90e,
sysevent.sys_id: 48abe270dbf20210497c1a4813961908, with priority 5
*** Script: FlowRunnerResult
Flow Object Name: global.change__unauthorized__review
Flow Object Type: flow
Domain: null
Result Time: 2024-06-12 17:45:37
ContextId: 08abe2706cf202107b7d3b283f7ee108
count: 0
```

## run()

Runs the flow, subflow, or action with the specified parameters.

**Returns**

| Type | Description |
| --- | --- |
| ScriptableFlowRunnerResultsScoped | Object containing the execution details of a Workflow Studio<br> action, flow, or subflow. |

### Example

This shows how to create a
ScriptableFlowRunner builder object and uses it to execute an approval action on a
specific record. A ScriptableFlowRunnerResult object captures the execution
arguments and action outputs.

```

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```

## subflow(String scopedSubflowName)

Identifies the scope and name of the subflow to execute.

See also:

- [ScriptableFlowRunner - action(String scopedActionName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-action_S "Identifies the scope and name of the action to execute.")
- [ScriptableFlowRunner - flow(String scopedFlowName)](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/sn_fd-namespace/ScriptableFlowRunnerScopedAPI#FlowRunner-flow_S "Identifies the scope and name of the flow to execute.")

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| scopedSubflowName | String | Scope and name of the subflow to execute. For example, `global.subflowName`. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a subflow that logs a message.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .subflow('global.output_test')
      .inForeground()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
record-watcher asynchronous tracking complete - time: 1 ms. Executed responders: 1
record-watcher asynchronous tracking complete - time: 1 ms. Executed responders: 1
*** Script: FlowRunnerResult
Flow Object Name: global.output_test
Flow Object Type: subflow
Domain: null
Result Time: 2024-08-02 22:52:08
ContextId: b2dxx659bebf01101d72200x503x19pr
count: 2
```

## timeout(Number timeout)

Sets a timeout for a flow, subflow, or action execution.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| timeout | Number | Timeout in milliseconds. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a flow and sets a timeout for two minutes.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .flow('global.test_flow')
      .inForeground()
      .timeout(120000)
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

```
Flow Designer: Cloning a new session to run as as user id: [user_name] from original user session: [user_name]
Flow Designer: Reverting cloned session to original user session: [user_name]
*** Script: FlowRunnerResult
Flow Object Name: global.test_flow
Flow Object Type: flow
Domain: null
Result Time: 2020-06-08 18:22:35
ContextId: null
count: 0
```

## withConnectionAliasOverride(String aliasName, String overrideName)

Overrides the Connections and Credentials alias associated with the flow,
action, or subflow. You can override the default parent alias with any of its child
aliases.

To learn more about overriding a Connections and Credentials alias, see Supporting multiple
connections.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| parentAliasSysID | String | The sys\_id of the parent alias, the alias you want to override. |
| overrideAliasSysID | String | The sys\_id of the child alias, the alias you want to use when running the flow,<br> subflow, or action. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

This shows how to run a flow using a different alias than the default associated
with the flow.

```
(function() {
  try {

    var result = sn_fd.FlowAPI.getRunner()
      .flow('global.test_flow')
      .withConnectionAliasOverride('sn_original_alias.spoke', 'x_new_alias.spoke')
      .inForeground()
      .run();

    gs.info(result.debug());

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();
```

## withInputs(Map inputs)

Adds a collection of inputs. If a name in one of the name-value pairs already exists,
the new value replaces the pre-existing value.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| inputs | Object | Map object containing the name-value pairs that define inputs for the flow,<br> subflow, or action. |

**Returns**

| Type | Description |
| --- | --- |
| [ScriptableFlowRunner](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server/ScriptableFlowRunnerScopedAPI) | Builder object used to run a Workflow Studio action, flow, or<br> subflow. |

### Example

Creates an input object and passes the value to the withInputs()
method.

```

(function() {
  try {

    var inputs = {};

    inputs['sys_id'] = '57af7aec73d423002728660c4cf6a71c';  // Pass the record's sys_id in as input.

    var result = sn_fd.FlowAPI.getRunner()  // Create a ScriptableFlowRunner builder object.
      .action('global.markapproved')        // Run the global scope action named markapproved.
      .inForeground()
      .inDomain('TOP/ACME')                 // Run the action from the TOP/ACME domain.
      .withInputs(inputs)
      .run();                               // Run the action and return a FlowRunnerResult object.

    var contextId = result.getContextId();  // Retrieve the context ID from the result
    var dateRun = result.getDate();
    var domainUsed = result.getDomainId();  // Retrieve the Domain ID from the result.
    var flowName = result.getFlowObjectName();
    var flowObjectType = result.getFlowObjectType();

    var outputs = result.getOutputs();            // Retrieve any outputs from the action execution.
    var newApprovalStatus = outputs['approval'];  // Echo back the approval status for verification.

  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);
  }

})();

```