require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

const MONGODB_URI = `mongodb+srv://kishanknaik03:${process.env.MONGODB_PASSWORD}@aws1freecluster.pa4wd.mongodb.net/db?retryWrites=true&w=majority&appName=AWS1FreeCluster`;

// MongoDB Connection
mongoose
    .connect(MONGODB_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true
    })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('Could not connect to MongoDB Atlas:', err));

// Define Employee Schema
const employeeSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
        role: String,
        email: String,
        password: String,
        departments: [String],
        skills: [String],
        designation: String,
    },
    { collection: 'employeeDB' }
);

const Employee = mongoose.model('Employee', employeeSchema);

// Define Task Schema
const taskSchema = new mongoose.Schema(
    {
        _id: String,
        taskMessage: String,
        taskDescription: String,
        level: String,
        empFlag: Boolean,
        manFlag: Boolean,
        deadlineDate: Date,
        deadlineTime: String,
        emp_ids: [String],
        status: String,
        newTaskId: String,
        createdBy: String
    },
    { collection: 'taskAssign' }
);

const Task = mongoose.model('Task', taskSchema);

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;

    console.log('Login attempt:', {
        userId,
        password,
        body: req.body
    });

    try {
        // Check if we're receiving the data correctly
        if (!userId || !password) {
            console.log('Missing credentials:', { userId, password });
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and password are required' 
            });
        }

        const user = await Employee.findOne({ _id: userId });
        console.log('Database response:', user);

        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.password !== password) {
            console.log('Password mismatch for user:', userId);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid password' 
            });
        }

        console.log('Login successful for user:', userId);
        return res.json({ 
            success: true, 
            role: user.role,
            userId: user._id 
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { name, userId, role, designation, skills, departments, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await Employee.findOne({ _id: userId });
        const existingEmail = await Employee.findOne({ email: email });
        if (existingUser) {
            return res.json({ success: false, message: 'User ID already exists' });
        }
        if (existingEmail) {
            return res.json({ success: false, message: 'Email already exists' });
        }

        // Create new employee
        const newEmployee = new Employee({
            _id: userId,
            name,
            role,
            designation,
            skills: skills.split(',').map(skill => skill.trim()),
            departments: Array.isArray(departments) ? departments : departments.split(',').map(dept => dept.trim()),
            email,
            password
        });

        await newEmployee.save();
        res.json({ success: true, message: 'Account created successfully' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update the tasks endpoint to be more specific for employees
app.get('/tasks/employee/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await Task.find({ emp_ids: userId });
        
        console.log(`Fetching tasks for employee ${userId}:`, tasks); // Debug log
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        res.status(500).json({ success: false, message: 'Error fetching tasks' });
    }
});

// Mark Task as Complete
app.post('/tasks/mark-complete', async (req, res) => {
    const { taskId } = req.body;

    try {
        const task = await Task.findOne({ _id: taskId });

        if (task) {
            if (task.empFlag === null || task.empFlag === false) {
                task.empFlag = true;
                await task.save();
                res.json({ success: true, message: 'Task marked as complete' });
            } else {
                res.json({ success: false, message: 'Task is already marked as complete or awaiting approval' });
            }
        } else {
            res.json({ success: false, message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error marking task as complete:', error);
        res.status(500).json({ success: false, message: 'Error marking task as complete' });
    }
});

// Update default route to serve index3.html
app.get('/manager-login', (req, res) => {
    res.sendFile(__dirname + '/public/index3.html');
});

// Update default route to serve index3.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Add route for manager dashboard
app.get('/manager-dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/manager-dashboard.html');
});

// Add route for employee dashboard (rename existing dashboard route)
app.get('/employee-dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/index-e-page.html');
});

// Manager info endpoint
app.get('/api/manager-info/:userId', async (req, res) => {
    try {
        console.log('Fetching manager info for userId:', req.params.userId);
        const manager = await Employee.findOne({ 
            _id: req.params.userId,
            role: 'manager'  // Ensure we're getting a manager
        });
        
        console.log('Manager data found:', manager);
        
        if (manager) {
            res.json({ 
                success: true, 
                name: manager.name,
                departments: manager.departments
            });
        } else {
            console.log('No manager found with ID:', req.params.userId);
            res.json({ success: false, message: 'Manager not found' });
        }
    } catch (error) {
        console.error('Error in manager-info endpoint:', error);
        res.status(500).json({ success: false, message: 'Error fetching manager info' });
    }
});

// Employees by department endpoint
app.get('/api/employees-by-departments', async (req, res) => {
    const { departments } = req.query;
    console.log('Fetching employees for departments:', departments);
    
    try {
        const departmentList = departments.split(',');
        const employees = await Employee.find({
            departments: { $in: departmentList },
            role: "employee"
        }).select('name designation departments _id');

        console.log('Found employees:', employees);
        
        res.json({ success: true, employees });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, message: 'Error fetching employees' });
    }
});

// Get last task ID endpoint
app.get('/api/tasks/last-id', async (req, res) => {
    try {
        const lastTask = await Task.findOne()
            .sort({ _id: -1 })
            .limit(1);

        res.json({
            success: true,
            lastId: lastTask ? lastTask._id : null
        });
    } catch (error) {
        console.error('Error fetching last task ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching last task ID'
        });
    }
});

// Create new task endpoint
app.post('/api/tasks', async (req, res) => {
    try {
        const taskData = req.body;
        
        const newTask = new Task({
            _id: taskData._id,
            taskMessage: taskData.taskMessage,
            taskDescription: taskData.taskDescription,
            level: taskData.level,
            empFlag: null,
            manFlag: null,
            deadlineDate: new Date(taskData.deadlineDate),
            deadlineTime: taskData.deadlineTime,
            emp_ids: taskData.emp_ids,
            status: 'InProgress',
            newTaskId: null,
            createdBy: taskData.createdBy
        });

        await newTask.save();
        res.json({ success: true, message: 'Task created successfully' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get tasks by status and flags for manager
app.get('/api/tasks/:filter', async (req, res) => {
    const { filter } = req.params;
    const managerId = req.query.managerId; // We'll send this from frontend

    try {
        let query = {};

        switch (filter) {
            case 'completed':
                query = {
                    empFlag: true,
                    manFlag: true,
                    status: 'Success'
                };
                break;
            case 'inProgress':
                query = {
                    empFlag: null,
                    manFlag: null,
                    status: 'InProgress'
                };
                break;
            case 'review':
                query = {
                    empFlag: true,
                    manFlag: null,
                    status: 'InProgress'
                };
                break;
            default:
                throw new Error('Invalid filter type');
        }

        // Add manager ID to query to only get tasks created by this manager
        query.createdBy = managerId;

        const tasks = await Task.find(query);
        res.json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update task status endpoint
app.post('/api/tasks/update-status', async (req, res) => {
    const { taskId } = req.body;

    try {
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            {
                manFlag: true,
                status: 'Success'
            },
            { new: true }
        );

        if (updatedTask) {
            res.json({ success: true, task: updatedTask });
        } else {
            res.json({ success: false, message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add this test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const dbName = mongoose.connection.db.databaseName;
        res.json({
            success: true,
            connected: mongoose.connection.readyState === 1,
            database: dbName,
            collections: collections.map(c => c.name)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
