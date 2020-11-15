// Vue Instance
let app = new Vue({
    el: '#app',
    data: {
        deal: {
            id: null,
            name: null,
        },
        account: {
            id: null,
            name: null
        },
        contacts: [],
        newContact: {
            first: null, 
            last: null, 
            title: null, 
            role: null, 
            email: null, 
            phone: null
        },
        loading: false
    },
    computed: {

    },
    methods: {
        setDeal(dealId) {
            vm = this;
            vm.deal.id = dealId;
            // Get Deal Via API
            ZOHO.CRM.API.getRecord({Entity:"Deals", RecordID: dealId})
                .then(deal => {
                    console.log(deal.data[0]);
                    vm.deal.name = deal.data[0].Account_Name.name;
                    vm.account.name = deal.data[0].Account_Name.name;
                    vm.account.id = deal.data[0].Account_Name.id;
                });

            // Get Deal's Contacts via API
            ZOHO.CRM.API.getRelatedRecords({Entity: "Deals", RecordID: dealId, RelatedList: "Contact_Roles", page: 1, per_page: 200})
                .then(contacts => {

                    vm.contacts = contacts.data.map(contact => {
                        return {
                            name: contact.Full_Name,
                            id: contact.id,
                            inPerson: false,
                            call: false,
                            email: false,
                            social: false,
                            loading: false
                        };
                    });
                });
        },

        createActivities() {
            vm = this;
            vm.loading = true;
            for(let i = 0; i < vm.contacts.length; i++) {
                contact = vm.contacts[i];
                vm.contacts[i].loading = true;
                vm.executeFunction(contact)
                    .then(response => {
                        console.log(response);
                        vm.contacts[i].inPerson = false;
                        vm.contacts[i].call = false;
                        vm.contacts[i].email = false;
                        vm.contacts[i].social = false;
                        vm.contacts[i].loading = false;
                        if (i == vm.contacts.length - 1) {
                            vm.loading = false;
                        }
                    });
            }
        },

        executeFunction(contact) {
            vm = this;
            let func_name = 'Create_Widget_Activites_Serverless';
            let req_data = {
                'deal_id': vm.deal.id,
                'contact_id': contact.id,
                'in_person': contact.inPerson.toString(),
                'call': contact.call.toString(),
                'email': contact.email.toString(),
                'social': contact.social.toString()
            };
            return ZOHO.CRM.FUNCTIONS.execute(func_name, req_data);
        },

        addContact() {
            vm = this;
            vm.loading = true;

            let contactData = {
                'First_Name': vm.newContact.first,
                'Last_Name': vm.newContact.last,
                'Email': vm.newContact.email,
                'Contact_Role': vm.newContact.role,
                'Title': vm.newContact.title,
                'Phone': vm.newContact.phone,
                'Account_Name': vm.account.id
            };
            ZOHO.CRM.API.insertRecord({Entity: "Contacts", APIData: contactData})
                .then(response => {
                    // Get Contact ID
                    contactId = response.data[0].details.id;
                    console.log(contactId);

                    // Get Role ID
                    roleId = null;
                    if(vm.newContact.role == 'Teacher') {
                        roleId = '4208697000000006871';
                    }
                    else if (vm.newContact.role == 'Decision Maker') {
                        roleId = '4208697000000006873';
                    }
                    else if(vm.newContact.role == 'Purchasing') {
                        roleId = '4208697000000006875';
                    }
                    console.log(roleId);
                    // Setup Related List Records
                    let contactRolesData = {
                        'Contact_Role': roleId
                     };
                    console.log(contactRolesData);
                    //  ( TEXT relationName , NUMBER id , TEXT parentModuleName , NUMBER parentRecordId , KEY-VALUE dataMap , ? TEXT connections )
                    // Update Contact Roles on Deal with new Contact
                     ZOHO.CRM.API.updateRelatedRecords({Entity: "Deals", 
                                                        RecordID: vm.deal.id, 
                                                        RelatedList: "Contact_Roles", 
                                                        RelatedRecordID: contactId,
                                                        APIData: contactRolesData})
                        .then(res => {
                            console.log(res);
                            vm.contacts.push({
                                name: vm.newContact.first + ' ' + vm.newContact.last,
                                id: contactId,
                                inPerson: false,
                                call: false,
                                email: false,
                                social: false,
                                loading: false

                                
                            });

                            vm.loading = false;
                            vm.newContact = {
                                first: null, 
                                last: null, 
                                title: null, 
                                role: null, 
                                email: null, 
                                phone: null
                            };
                        })
                        .catch(error => {
                            console.log(error);
                            vm.loading = false;
                        });
                });
                // ADD CATCH STATEMENT
        }
    },
    created() {
        // Get Deal Data from CRM
        vm = this;
        ZOHO.embeddedApp.on("PageLoad", entity => {
            vm.setDeal(entity.EntityId[0]);
        });
        
        // Initialize Widget Connection
        ZOHO.embeddedApp.init();
    },
    updated() {
        $('[data-toggle="tooltip"]').tooltip({delay: {show: 750, hide: 50}, trigger: "hover"});
    }
});