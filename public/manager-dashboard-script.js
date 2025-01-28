// Check if user is logged in when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, checking for userId');
    const userId = sessionStorage.getItem('userId');
    console.log('UserId from session:', userId);

    if (!userId) {
        console.log('No userId found, redirecting to login');
        window.location.href = '/index3.html';
        return;
    }
    await loadManagerData(userId);
});

// Load manager data and departments
async function loadManagerData(userId) {
    try {
        console.log('Fetching manager data for userId:', userId);
        const response = await fetch(`/api/manager-info/${userId}`);
        const data = await response.json();
        console.log('Manager data received:', data);
        
        if (data.success) {
            // Display manager name
            const managerName = document.getElementById('managerName');
            if (managerName) {
                managerName.textContent = data.name;
                console.log('Manager name set:', data.name);
            } else {
                console.error('managerName element not found');
            }
            
            // Display departments
            if (data.departments && data.departments.length > 0) {
                console.log('Departments found:', data.departments);
                showDepartments(data.departments);
                loadEmployees(data.departments[0]);
            } else {
                console.log('No departments found');
                const departmentsList = document.getElementById('departmentsList');
                if (departmentsList) {
                    departmentsList.innerHTML = '<div class="department-item">No departments assigned</div>';
                }
            }
        } else {
            console.error('Failed to load manager data:', data.message);
        }
    } catch (error) {
        console.error('Error in loadManagerData:', error);
    }
}

// Display departments in sidebar
function showDepartments(departments) {
    console.log('Showing departments:', departments);
    const departmentsList = document.getElementById('departmentsList');
    
    if (!departmentsList) {
        console.error('departmentsList element not found');
        return;
    }

    departmentsList.innerHTML = '';
    departments.forEach(dept => {
        const deptDiv = document.createElement('div');
        deptDiv.className = 'department-item';
        deptDiv.textContent = dept;
        deptDiv.onclick = () => {
            console.log('Department clicked:', dept);
            document.querySelectorAll('.department-item').forEach(item => 
                item.classList.remove('active'));
            deptDiv.classList.add('active');
            loadEmployees(dept);
        };
        departmentsList.appendChild(deptDiv);
    });

    if (departments.length > 0) {
        departmentsList.firstChild.classList.add('active');
    }
}

// Load employees for a specific department
async function loadEmployees(department) {
    try {
        console.log('Loading employees for department:', department);
        const response = await fetch(`/api/employees-by-departments?departments=${department}`);
        const data = await response.json();
        console.log('Employee data received:', data);

        if (data.success) {
            displayEmployees(data.employees);
        } else {
            console.error('Failed to load employees:', data.message);
        }
    } catch (error) {
        console.error('Error in loadEmployees:', error);
    }
}

// Display employees in table
function displayEmployees(employees) {
    console.log('Displaying employees:', employees);
    const employeeList = document.getElementById('employeeList');
    
    if (!employeeList) {
        console.error('employeeList element not found');
        return;
    }

    employeeList.innerHTML = '';

    if (employees.length === 0) {
        employeeList.innerHTML = '<tr><td colspan="4">No employees found</td></tr>';
        return;
    }

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="employee-select" value="${employee._id}"></td>
            <td>${employee.name}</td>
            <td>${employee.designation}</td>
            <td>${employee.departments.join(', ')}</td>
        `;
        employeeList.appendChild(row);
    });

    addCreateTaskButton();
}

// Add create task button
function addCreateTaskButton() {
    if (!document.getElementById('createTaskBtn')) {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'create-task-container';
        btnContainer.innerHTML = `
            <button id="createTaskBtn" class="create-task-btn" onclick="createTask()">
                <span class="plus-symbol">+</span>
                Create Task
            </button>
        `;
        document.querySelector('.employee-section').appendChild(btnContainer);
    }
}

// Handle create task button click
function createTask() {
    const selectedEmployees = Array.from(document.querySelectorAll('.employee-select:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedEmployees.length === 0) {
        alert('Please select at least one employee');
        return;
    }
    console.log('Selected employees for task:', selectedEmployees);
    sessionStorage.setItem('selectedEmployees', JSON.stringify(selectedEmployees));
}

// Handle logout
function logout() {
    console.log('Logging out');
    sessionStorage.clear();
    window.location.href = '/index3.html';
}
