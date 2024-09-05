import { Record } from '@servicenow/sdk/core'

export default Record({
    $id: '1d0bb9de1b7f0610132a55392a4bcb73',
    table: 'sys_rest_message_fn',
    data: {
        authentication_type: 'inherit_from_parent',
        function_name: 'Get Patch Deployment Details',
        http_method: 'get',
        lock: false,
        qualified_name: 'Patch - Tanium Integration Core [ Get Patch Deployment Details ]',
        rest_endpoint: '${tanium_module_api_url}/patch/v1/deployments/${patch_deployment_id}',
        rest_message: 'ce1194101b090610132a55392a4bcb85',
        sys_name: 'Get Patch Deployment Details',
        use_basic_auth: false,
        use_mutual_auth: false,
    },
})
