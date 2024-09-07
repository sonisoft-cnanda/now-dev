// The inputs are a map of the variables defined in the inputs related list below.
// Inputs are consumed in the step configuration. Input
// values may be hardcoded or mapped from the outputs of a previous step.
// If a test author using your step uses mapping to pass in an output from a previous 
// test step then when referencing the input variable the mapping will be resolved 
// automatically
//  Example:
//      var myRecords = new GlideRecord(inputs.table);
//
// The outputs are a map of the variables defined in the outputs related list.
// Outputs should be set (assigned) in order to pass data out of a test step that
// can be consumed my mapping as an input to subsequent steps. 
//  Example:
//      outputs.table = gr.getRecordClassName()
//
//
// Note that inputs and outputs are strongly typed as defined in their variable definition.
// Their behavior is the same as a dictionary defined field of the same type in a table.
//
// The stepResult is a simple API for controlling the step pass/fail and logging with three
// methods:
//      stepResult.setFailed: Causes step to fail
//
//      stepResult.setSuccess: Causes step to succeed
//
//      stepResult.setOutputMessage: Log a message to step results after step executes.
//            Can only be called once or will overwrite previous 
//            message
//
// If neither setFailed or setSuccess is called the default is to succeed.
//
// See 'Record Query' for an example of a scripted step config 
// or see test 'Check change approvals get generated'
//
// Example usage of step timeout in script
//      var counter = 0;
//      // 'timeout' is a field on the step form
//      while (counter <= timeout) {
//            if (desiredOutcome) {
//                stepResult.setOutputMessage('Success!');
//                stepResult.setSuccess();
//                return;
//            }
//            counter++;
//            gs.sleep(1000);
//      }
//
//      // desired outcome did not occur within the timeout
//      stepResult.setOutputMessage('Failure!');
//      stepResult.setFailed();
//
(function executeStep(inputs, outputs, stepResult, timeout) {

}(inputs, outputs, stepResult, timeout));
