Version: zurich

## API Reference - Server Side Legacy

ServiceNow provides JavaScript APIs for use within scripts running on the ServiceNow platform to deliver common functionality. This reference lists available classes and methods along with parameters, descriptions, and examples to make extending the ServiceNow platform easier.

**Please note:** These APIs are provided to support legacy applications in the global scope. It is recommended that new applications should be scoped.

# Workflow

The Workflow script include provides methods that interface with the Workflow engine.

Use these methods to manipulate workflows.

## Workflow()

Constructor for Workflow class.

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
var w = new Workflow();
```

## broadcastEvent(String contextId, String eventName)

Sends the specified event (message) into the workflow context to pass along to the
executing activities.

Typical use of this method is to enable activities that wait for some action to occur
before proceeding. For additional information on using broadcastEvent,
refer to [Workflow event-specific\\
functions](https://docs.servicenow.com/csh?topicname=r_WorkflowEventSpecificFunctions&version=zurich&pubname=zurich-build-workflows).

For a list of the available OOB events, refer to [Workflow events in the base\\
system](https://docs.servicenow.com/csh?topicname=r_WorkflowEventsInTheBaseSystem&version=zurich&pubname=zurich-build-workflows).

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| contextId | String | The context ID. |
| eventName | String | The name of the event. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
//where current is a task record with a workflow context
      var wf = new Workflow().getRunningFlows(current);
      while(wf.next()) {
          new Workflow().broadcastEvent(wf.sys_id, 'resume');
      }
```

## cancel(GlideRecord record)

Cancels all running workflows on this record by broadcasting the
cancel event to activities in all running workflows on this
record.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| record | GlideRecord | GlideRecord on any table. All workflows running on this<br> record will be cancelled. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
//get workflow helper
      var workflow = new Workflow();
      //cancel all the workflows, where current is a task record with a workflow context
      workflow.cancel(current);
      gs.addInfoMessage(gs.getMessage("Workflows for {0} have been cancelled", current.getDisplayValue()));
```

## cancelContext(GlideRecord context)

Cancels this running context by broadcasting a cancel event to
activities in this workflow context.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| context | GlideRecord | GlideRecord of the running context to cancel. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
// If a workflow has started for this item, cancel it, where current is a task record with a workflow context
      if ((current.stage == 'Request Cancelled') && current.context
          && !current.context.nil()) {
      var w = new Workflow();
      var now_GR = new GlideRecord('wf_context');

      if (now_GR.get(current.context))
          w.cancelContext(now_GR);
      }
```

## deleteWorkflow(GlideRecord current)

Deletes all the workflows on the record.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| current | GlideRecord | GlideRecord for which the caller wants to delete all<br> workflows. This can be any record on any table. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
//where current is a task record with a workflow context
      var wkfw = new Workflow();
      wkfw.deleteWorkflow(current);

```

## fireEvent(GlideRecord eventRecord, String eventName, Object eventParms)

Fires the named event of a running workflow on the input record.

Used in Activities Approval Coordinator, Timer, Lock, and some others.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| eventRecord | GlideRecord | Event record listed in the Workflow Executing Activites \[wf\_executing\] table. |
| eventName | String | The name of the event to send to the executing workflow. |
| eventParms | Object | Optional. Parameters in JSON format used by the event. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
// where current is a task record with a workflow context
  var w = new Workflow();
  w.fireEvent(current, 'execute');
```

## fireEventById(String eventRecordId, String eventName)

Fires the named event on the record specified by record ID.

Used in Activities Approval Coordinator,
Timer, Lock, and some others.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| eventRecordId | String | The sys\_id of the glide record. |
| eventName | String | The name of the event to send to the executing workflow. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
var wkfw = new Workflow();
      wkfw.fireEventById('f2400ec10b0a3c1c00ca5bb5c6fae427','Timer');
```

## getContexts(GlideRecord record)

Returns all workflow contexts for a specified record.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| record | [GlideRecord](https://developer.servicenow.com/dev.do#!/reference/api/zurich/server_legacy/c_GlideRecordAPI "The GlideRecord API is used for database operations.") | GlideRecord for which the caller wants a list of all<br> workflow contexts. This can be any record on any table for which the caller wants<br> the running workflow contexts. |

**Returns**

| Type | Description |
| --- | --- |
| GlideRecord | GlideRecord in the Workflow context \[wf\_context\] table filtered for all<br> workflow contexts for the specified record (in any state, such as running,<br> cancelled, finished). |

### Example

```
//where current is a task record with a workflow context
var wkfw = new Workflow();
var context = wkfw.getContexts(current);
while (context.next())
  gs.print(context.started);
```

## getEstimatedDeliveryTime(String workflowId)

Gets the estimated time for a workflow to complete.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowId | String | Sys\_id of the workflow (table wf\_workflow) to get the estimated run<br> time. |

**Returns**

| Type | Description |
| --- | --- |
| String | Display value from a GlideDuration (e.g., 3 days), or blank if unknown. |

### Example

```
var wkfw = new Workflow();
      gs.print(wkfw.getEstimatedDeliveryTime('b99a866a4a3623120074c033e005418f'));
```

2 Days

## getEstimatedDeliveryTimeFromWFVersion(GlideRecord wfVersion)

Get the estimated elapsed execution time for the workflow version.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| wfVersion | GlideRecord | GlideRecord on table wf\_workflow\_version of a specific<br> workflow version for which the caller wants the estimated during of<br> executing. |

**Returns**

| Type | Description |
| --- | --- |
| String | Display value from a GlideDuration (e.g., 3 days),<br> or blank if unknown. |

### Example

```
//where current is a task record with a workflow context
      var wkfw = new Workflow();
      var context = wkfw.getContexts(current);
      gs.print(wkfw.getEstimatedDeliveryTimeFromWFVersion(context.wf_version));
```

## getReturnValue(String workflowID, Number amount, Boolean result)

Gets the appropriate workflow return value for the input workflow ID.
This is either the workflow checked out by the current user or the published workflow with the most recent date.

This is either the workflow checked out by the current user or the published workflow with
the most recent date. This method is available starting with the Fuji release.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowID | String | The sys\_id of the workflow (table wf\_workflow) |
| amount | Number | amount |
| result | Boolean | True, if true |

**Returns**

| Type | Description |
| --- | --- |
| ??? | The return value of the workflow as specified by the Return Value activity.<br> Workflows without a Return Value activity return a null value. |

### Example

```
var wkfw = new Workflow();
      wkfw.getReturnValue('context');
```

```
*** Script: b99a866a4a3623120074c033e005418f
```

## getRunningFlows(GlideRecord record)

Gets all the currently running workflow contexts for the input record.

The input record is any record on any table for which the caller wants the running workflow
contexts.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| record | GlideRecord | GlideRecord of the record for which the caller wants a list<br> of all running workflows. |

**Returns**

| Type | Description |
| --- | --- |
| GlideRecord | GlideRecord on table wf\_context and filtered for all executing workflow<br> contexts. |

### Example

```
//where current is a task record with a workflow context
      var wf = new Workflow().getRunningFlows(current);
      while(wf.next()) {
          new Workflow().broadcastEvent(wf.sys_id, 'pause');
      }
```

## getVersion(String workflowID)

Gets the appropriate workflow version for the input workflow ID.
This is either the workflow checked out by the current user or the published workflow with the most recent date.

This is either the workflow checked out by the current user or the published workflow with
the most recent date.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowID | String | The sys\_id of the workflow (table wf\_workflow) |

**Returns**

| Type | Description |
| --- | --- |
| none |  |

### Example

```
var wkfw = new Workflow();
      wkfw.getVersion('b99a866a4a3623120074c033e005418f');
```

## getVersionFromName(String workflowName)

Returns the appropriate workflow version for the input workflow name.

See getVersion() for more information.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowName | String | Name of the workflow (table wf\_workflow) |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
var wkfw = new Workflow();
      wkfw.getVersionFromName('Emergency Change');
```

## getWorkflowFromName(String workflowName)

Returns the sys\_id of the workflow associated with the specified workflow
name.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowName | String | Name of the workflow. |

**Returns**

| Type | Description |
| --- | --- |
| String | The sys\_id of the workflow associated with the passed in name. |

### Example

```
var wflw = new Workflow();
      gs.print(wflw.getWorkflowFromName('Emergency Change'));
```

## hasWorkflow(GlideRecord record)

Determines if a specified record has any workflow contexts associated to it.

This includes running and completed workflow contexts.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| record | GlideRecord | GlideRecord under scrutiny. This<br> GlideRecord can be from any table. |

**Returns**

| Type | Description |
| --- | --- |
| Boolean | True, if record has associated workflow; otherwise, returns False. |

### Example

```
var wkfw = new Workflow();
      gs.print(wkfw.hasWorkflow('f2400ec10b0a3c1c00ca5bb5c6fae427'));
```

false

## restartWorkflow(GlideRecord current, Boolean maintainStateFlag)

Recalculates the approvals and tasks for a workflow by adding new approvals and tasks,
while not resetting current approvals and tasks.

You can use this method to perform such tasks as adding a company to a change request,
without resetting the current approvals for companies already in the workflow.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| current | GlideRecord | GlideRecord of the record this workflow is executing. This<br> can by any record on any table. |
| maintainStateFlag | Boolean | Flag that indicates whether to maintain all approvals and tasks in their<br> current state.<br>Valid values:<br>- true: Maintain all approvals and tasks in their current state.<br>- false: Update all approval and task states. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

This shows the workflow being restarted with the approval file changing from Rejected to
Requested.

```
(function(){
  var comment = 'Workflow Restarted - the Approval Field changing from Rejected to Requested';
  var gLock = new GlideRecordLock(current);
    gLock.setSpinWait(50);
  if (gLock.get()) {
    new Workflow().restartWorkflow(current, false);
    current.setDisplayValue('approval_history', comment);
  }
})
```

## runFlows(GlideRecord record, String operation)

Runs all workflows for a given record in a given table and its descendant tables.

Sample usage can be seen in the Script Includes "SNC - Run parent workflows", and "SNC -
Run parent workflows (Approval)".

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| record | GlideRecord | GlideRecord to run workflows against. |
| operation | String | Database operation.<br>Valid values:<br>- insert<br>- update<br>- delete |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
var now_GR = new GlideRecord('wf_test');
now_GR.addQuery('parent', current.parent);
now_GR.addQuery('sys_id','!=',current.sys_id);
now_GR.query();
while(now_GR.next()) {
    new Workflow().runFlows(now_GR, 'update');
}
```

## startFlow(String workflowId, GlideRecord current, String operation, Array vars)

Starts a specified workflow.

See script include WorkflowScheduler and Business Rule "Start Workflow" on table
sc\_req\_item for examples of use.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowId | String | The sys\_id of the workflow to start. This sys\_id refers to table<br> wf\_workflow. |
| current | GlideRecord | The record to use as current in this workflow. This is normally from the<br> Table field of the workflow properties for this<br> workflow. |
| operation | String | The operation to perform on current. Possible values:<br> insert, update,<br> delete. |
| vars | Array | Collection of variables to add to the workflow |

### Example

```
////where current is a task record with a workflow context
      var w = new Workflow();
      var context = w.startFlow(id, current, current.operation(), getVars());
```

## startFlowFromContextInsert(GlideRecord context, String operation)

Helper method for business rule Auto start on context.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| context | GlideRecord | GlideRecord on table wf\_context of a new record (the "current" record in the<br> business rule). |
| operation | String | Database operation being performed. One of insert,<br> update, delete. |

**Returns**

| Type | Description |
| --- | --- |
| void | Method does not return a value |

### Example

```
//where current is a task record with a workflow context
      current.name = current.workflow_version.name;
      current.started_by.setValue(gs.userID());

      if (gs.nil(current.id)) {
        var now_GR = new GlideRecord('wf_workflow_execution');
        now_GR.name = current.name;
        now_GR.insert();

        current.table = 'wf_workflow_execution';
        current.id = now_GR.sys_id;
      }

      var wf = new Workflow();
      wf.startFlowFromContextInsert(current, current.operation())
```

## startFlowRetroactive(String workflowId, Number retroactiveMSecs, GlideRecord current, String operation, Array, ???)

Used by business rule Start Workflow on table task\_sla. This starts
a workflow and the extra arguments to this method are used by activity "Timer" to pause the
execution of the workflow for some duration.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| workflowID | String | The sys\_id of the workflow to start. This sys\_id refers to table<br> wf\_workflow. |
| retroactiveMSecs | Number | Delay in milliseconds used by Activity Timer. |
| current | GlideRecord | GlideRecord of the record to use as current in this workflow. This is normally<br> from the Table field of the workflow properties for this<br> workflow |
| operation | String | Database operation being performed.One of insert,<br> update, delete. |
| vars | Array | Collection of variables to add to the workflow. |
| withSchedule | ??? | Schedule used by Activity Timer |

**Returns**

| Type | Description |
| --- | --- |
| GlideRecord | A GlideRecord on table wf\_context on the inserted record for this newly<br> created workflow context. |

### Example

```
// is this a retroactive start?
      ////where current is a task record with a workflow context
      var msecs = new GlideDateTime().getNumericValue() - current.start_time.getGlideObject().getNumericValue();

      // treat this as a retroactive workflow start if the SLA started more than 5 seconds ago
      var w = new Workflow();
      if (msecs <= 5000)
        w.startFlow(id, current, current.operation());
      else
        w.startFlowRetroactive(id, msecs, current, current.operation());

      // update the record in case the workflow changed some values
      current.update();


```