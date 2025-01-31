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
    window.location.href = '/index.html';
}

// Update the displayTasks function to properly handle the time
function displayTasks(tasks, filter) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    // Filter tasks based on status
    let filteredTasks = tasks;
    switch (filter) {
        // ... existing filter cases ...
    }

    filteredTasks.forEach(task => {
        const status = checkTaskStatus(task);
        const row = document.createElement('tr');
        
        // Format the date and time properly
        const dueDate = new Date(task.deadlineDate);
        const formattedDate = dueDate.toLocaleDateString();
        
        // Format time from 24-hour to 12-hour format
        const formatTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        };

        const formattedTime = formatTime(task.deadlineTime);

        row.innerHTML = `
            <td>${task.taskMessage}</td>
            <td>${task.emp_ids.join(', ')}</td>
            <td class="task-status-cell">
                ${status}
                ${status === 'Overdue' ? 
                    '<span class="status-badge overdue">⚠️ Overdue!</span>' : 
                    status === 'Failed' ? 
                    '<span class="status-badge failed">❌ Failed</span>' : 
                    ''}
            </td>
            <td>${formattedDate}, ${formattedTime}</td>
            <td>
                <button onclick='viewTaskDetails(${JSON.stringify({
                    _id: task._id,
                    taskMessage: task.taskMessage,
                    taskDescription: task.taskDescription,
                    level: task.level,
                    empFlag: task.empFlag,
                    manFlag: task.manFlag,
                    deadlineDate: task.deadlineDate,
                    deadlineTime: task.deadlineTime,
                    emp_ids: task.emp_ids,
                    status: task.status
                })})' class="action-btn">
                    View Details
                </button>
                ${status === 'review' ? 
                    `<button onclick="approveTask('${task._id}')" class="action-btn">
                        Approve Task
                    </button>` : 
                    ''}
            </td>
        `;
        taskList.appendChild(row);
    });
}

// Update the viewTaskDetails function
function viewTaskDetails(task) {
    const status = checkTaskStatus(task);
    const modal = document.getElementById('taskDetailsModal');
    const content = document.getElementById('taskDetailsContent');
    
    const dueDate = new Date(task.deadlineDate);
    const formattedDate = dueDate.toLocaleDateString();
    
    // Format time
    const [hours, minutes] = task.deadlineTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;

    content.innerHTML = `
        <div class="task-detail-grid">
            <div class="detail-item">
                <strong>Task ID:</strong>
                <p>${task._id}</p>
            </div>
            <div class="detail-item">
                <strong>Task Name:</strong>
                <p>${task.taskMessage}</p>
            </div>
            <div class="detail-item">
                <strong>Description:</strong>
                <p>${task.taskDescription || 'No description provided'}</p>
            </div>
            <div class="detail-item">
                <strong>Priority Level:</strong>
                <p class="priority-${task.level.toLowerCase()}">${task.level}</p>
            </div>
            <div class="detail-item">
                <strong>Status:</strong>
                <p class="task-status-cell">
                    ${status}
                    ${status === 'Overdue' ? 
                        '<span class="status-badge overdue">⚠️ Overdue!</span>' : 
                        status === 'Failed' ? 
                        '<span class="status-badge failed">❌ Failed</span>' : 
                        ''}
                </p>
            </div>
            <div class="detail-item">
                <strong>Due Date & Time:</strong>
                <p>${formattedDate}, ${formattedTime}</p>
            </div>
            <div class="detail-item">
                <strong>Assigned To:</strong>
                <p>${task.emp_ids.join(', ')}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}
