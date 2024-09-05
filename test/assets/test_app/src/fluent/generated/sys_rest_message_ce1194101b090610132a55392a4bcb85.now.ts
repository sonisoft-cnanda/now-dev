import { Record } from '@servicenow/sdk/core'

export default Record({
    $id: 'ce1194101b090610132a55392a4bcb85',
    table: 'sys_rest_message',
    data: {
        access: 'public',
        authentication_type: 'no_authentication',
        description:
            'Tanium Patch-related REST methods for Tanium Integration Core application, including authentication.',
        name: 'Patch - Tanium Integration Core',
        rest_endpoint: '${tanium_module_api_url}/patch',
        sys_name: 'Patch - Tanium Integration Core',
        use_basic_auth: false,
        use_mutual_auth: false,
    },
})
