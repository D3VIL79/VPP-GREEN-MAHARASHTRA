const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

const faculties = [
    // VPPCOE Faculty
    { email: "mkadam@vppgreen.com", name: "Dr. M. Kadam", phone: "919920000010", inst: "00000000-0000-0000-0000-000000000001", dept: "Computer Engineering", role: "faculty" },
    { email: "asawant@vppgreen.com", name: "Prof. A. Sawant", phone: "919920000011", inst: "00000000-0000-0000-0000-000000000001", dept: "Computer Engineering", role: "faculty" },
    { email: "spatil@vppgreen.com", name: "Prof. S. Patil", phone: "919920000012", inst: "00000000-0000-0000-0000-000000000001", dept: "Information Technology", role: "faculty" },
    { email: "rnaik@vppgreen.com", name: "Dr. R. Naik", phone: "919920000013", inst: "00000000-0000-0000-0000-000000000001", dept: "Information Technology", role: "faculty" },
    { email: "ajoshi@vppgreen.com", name: "Dr. A. Joshi", phone: "919920000014", inst: "00000000-0000-0000-0000-000000000001", dept: "Computer Science & Engineering (AI & ML, Data Science)", role: "faculty" },
    { email: "sdeshpande@vppgreen.com", name: "Prof. S. Deshpande", phone: "919920000015", inst: "00000000-0000-0000-0000-000000000001", dept: "Electronics & Computer Science", role: "faculty" },
    { email: "nrane@vppgreen.com", name: "Dr. N. Rane", phone: "919920000016", inst: "00000000-0000-0000-0000-000000000001", dept: "Mechatronics Engineering", role: "faculty" },
    { email: "smehta@vppgreen.com", name: "Prof. S. Mehta", phone: "919920000017", inst: "00000000-0000-0000-0000-000000000001", dept: "Fine Art", role: "faculty" },
    
    // VPP Law Faculty
    { email: "anaik@vppgreen.com", name: "Dr. A. Naik", phone: "919920000020", inst: "00000000-0000-0000-0000-000000000002", dept: "Department of Law", role: "faculty" },
    { email: "vthorat@vppgreen.com", name: "Prof. V. Thorat", phone: "919920000021", inst: "00000000-0000-0000-0000-000000000002", dept: "Department of Law", role: "faculty" },
    { email: "gbhosle@vppgreen.com", name: "Prof. G. Bhosle", phone: "919920000022", inst: "00000000-0000-0000-0000-000000000002", dept: "Department of Law", role: "faculty" },
    
    // Phalke Architecture Faculty
    { email: "kshinde@vppgreen.com", name: "Prof. K. Shinde", phone: "919920000030", inst: "00000000-0000-0000-0000-000000000003", dept: "Department of Architecture", role: "faculty" },
    { email: "psawant@vppgreen.com", name: "Dr. P. Sawant", phone: "919920000031", inst: "00000000-0000-0000-0000-000000000003", dept: "Department of Architecture", role: "faculty" },
    { email: "akulkarni@vppgreen.com", name: "Prof. A. Kulkarni", phone: "919920000032", inst: "00000000-0000-0000-0000-000000000003", dept: "Department of Architecture", role: "faculty" },
    
    // Department HODs
    { email: "hod_cmpn@vppgreen.com", name: "HOD - Computer Engineering", phone: "919920000001", inst: "00000000-0000-0000-0000-000000000001", dept: "Computer Engineering", role: "department_hod" },
    { email: "hod_it@vppgreen.com", name: "HOD - Information Technology", phone: "919920000002", inst: "00000000-0000-0000-0000-000000000001", dept: "Information Technology", role: "department_hod" },
    { email: "hod_cse@vppgreen.com", name: "HOD - CSE (AI & ML, DS)", phone: "919920000003", inst: "00000000-0000-0000-0000-000000000001", dept: "Computer Science & Engineering (AI & ML, Data Science)", role: "department_hod" },
    { email: "hod_ecs@vppgreen.com", name: "HOD - Electronics & CS", phone: "919920000004", inst: "00000000-0000-0000-0000-000000000001", dept: "Electronics & Computer Science", role: "department_hod" },
    { email: "hod_mech@vppgreen.com", name: "HOD - Mechatronics Eng", phone: "919920000005", inst: "00000000-0000-0000-0000-000000000001", dept: "Mechatronics Engineering", role: "department_hod" },
    { email: "hod_fine@vppgreen.com", name: "HOD - Fine Art", phone: "919920000006", inst: "00000000-0000-0000-0000-000000000001", dept: "Fine Art", role: "department_hod" },
    { email: "hod_arch@vppgreen.com", name: "HOD - Department of Architecture", phone: "919920000007", inst: "00000000-0000-0000-0000-000000000003", dept: "Department of Architecture", role: "department_hod" },
    { email: "hod_law@vppgreen.com", name: "HOD - Department of Law", phone: "919920000008", inst: "00000000-0000-0000-0000-000000000002", dept: "Department of Law", role: "department_hod" },
    
    // Super Admin
    { email: "superadmin@vppgreen.com", name: "Super Admin", phone: "919920000000", inst: null, dept: null, role: "super_admin" },
];

async function run() {
    console.log("Registering", faculties.length, "users...");
    for (const f of faculties) {
        const { data, error } = await supabase.auth.signUp({
            email: f.email,
            password: 'Password123!',
            options: {
                data: {
                    full_name: f.name,
                    mobile: '+' + f.phone,
                    role: f.role,
                    institution_id: f.inst,
                    department: f.dept
                }
            }
        });
        if (error) {
            console.log(`Failed for ${f.email}:`, error.message);
        } else {
            console.log(`Success for ${f.email}`);
        }
    }
}
run();
