const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dylancychua:SWgydcBjIziGNDCS@cluster0.q0w7tfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schemas
const vehicleSchema = new mongoose.Schema({
    year: Number,
    make: String,
    model: String,
    plate: { type: String, required: true },
    status: { type: String, default: 'active' },
    fuelType: String,
    tankCapacity: Number,
    location: String,
    acquisitionDate: Date,
    currentMileage: { type: Number, default: 0 },
    lastService: Date,
    nextService: Date,
    createdAt: { type: Date, default: Date.now }
});

//maintenance log schema
const maintenanceLogSchema = new mongoose.Schema({
    vehicleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vehicle',
        required: true
    },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    odometer: { type: Number, required: true },
    serviceProvider: String,
    cost: Number,
    nextServiceDue: Date,
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

//road tax schema
// New Road Tax Schema
const roadTaxSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    taxId: { type: String, required: true },
    renewalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Create models
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
const RoadTax = mongoose.model('RoadTax', roadTaxSchema);

// API Routes

// GET all vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Failed to fetch vehicles' });
    }
});

// GET a specific vehicle
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ message: 'Failed to fetch vehicle' });
    }
});

// POST a new vehicle
app.post('/api/vehicles', async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        const savedVehicle = await newVehicle.save();
        res.status(201).json(savedVehicle);
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).json({ message: 'Failed to add vehicle' });
    }
});

// PUT (update) a vehicle
app.put('/api/vehicles/:id', async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        res.json(updatedVehicle);
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ message: 'Failed to update vehicle' });
    }
});

// DELETE a vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
        
        if (!deletedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        // Also delete all maintenance logs for this vehicle
        await MaintenanceLog.deleteMany({ vehicleId: req.params.id });
        
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Failed to delete vehicle' });
    }
});

// GET maintenance logs for a vehicle
app.get('/api/vehicles/:id/logs', async (req, res) => {
    try {
        const logs = await MaintenanceLog.find({ 
            vehicleId: req.params.id 
        }).sort({ date: -1 });
        
        res.json(logs);
    } catch (error) {
        console.error('Error fetching maintenance logs:', error);
        res.status(500).json({ message: 'Failed to fetch maintenance logs' });
    }
});

// GET a specific log entry
app.get('/api/logs/:id', async (req, res) => {
    try {
        const log = await MaintenanceLog.findById(req.params.id);
        
        if (!log) {
            return res.status(404).json({ message: 'Maintenance log not found' });
        }
        
        res.json(log);
    } catch (error) {
        console.error('Error fetching maintenance log:', error);
        res.status(500).json({ message: 'Failed to fetch maintenance log' });
    }
});

// POST a new maintenance log
app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new MaintenanceLog(req.body);
        const savedLog = await newLog.save();
        
        // Update vehicle with latest service information
        await Vehicle.findByIdAndUpdate(req.body.vehicleId, {
            lastService: req.body.date,
            nextService: req.body.nextServiceDue,
            currentMileage: req.body.odometer
        });
        
        res.status(201).json(savedLog);
    } catch (error) {
        console.error('Error adding maintenance log:', error);
        res.status(500).json({ message: 'Failed to add maintenance log' });
    }
});

// PUT (update) a maintenance log
app.put('/api/logs/:id', async (req, res) => {
    try {
        const updatedLog = await MaintenanceLog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedLog) {
            return res.status(404).json({ message: 'Maintenance log not found' });
        }
        
        // Update vehicle with latest service information if this is the most recent log
        const mostRecentLog = await MaintenanceLog.findOne({
            vehicleId: updatedLog.vehicleId
        }).sort({ date: -1 });
        
        if (mostRecentLog && mostRecentLog._id.toString() === updatedLog._id.toString()) {
            await Vehicle.findByIdAndUpdate(updatedLog.vehicleId, {
                lastService: updatedLog.date,
                nextService: updatedLog.nextServiceDue,
                currentMileage: updatedLog.odometer
            });
        }
        
        res.json(updatedLog);
    } catch (error) {
        console.error('Error updating maintenance log:', error);
        res.status(500).json({ message: 'Failed to update maintenance log' });
    }
});

// DELETE a maintenance log
app.delete('/api/logs/:id', async (req, res) => {
    try {
        const log = await MaintenanceLog.findById(req.params.id);
        
        if (!log) {
            return res.status(404).json({ message: 'Maintenance log not found' });
        }
        
        const deletedLog = await MaintenanceLog.findByIdAndDelete(req.params.id);
        
        // Update vehicle's last service information if needed
        const mostRecentLog = await MaintenanceLog.findOne({
            vehicleId: log.vehicleId
        }).sort({ date: -1 });
        
        if (mostRecentLog) {
            await Vehicle.findByIdAndUpdate(log.vehicleId, {
                lastService: mostRecentLog.date,
                nextService: mostRecentLog.nextServiceDue
            });
        } else {
            // No logs left, clear the service dates
            await Vehicle.findByIdAndUpdate(log.vehicleId, {
                lastService: null,
                nextService: null
            });
        }
        
        res.json({ message: 'Maintenance log deleted successfully' });
    } catch (error) {
        console.error('Error deleting maintenance log:', error);
        res.status(500).json({ message: 'Failed to delete maintenance log' });
    }
});

//get road tax
app.get('/api/vehicles/:id/taxes', async (req, res) => {
    try {
        const taxes = await RoadTax.find({ 
            vehicleId: req.params.id 
        }).sort({ renewalDate: -1 });
        
        res.json(taxes);
    } catch (error) {
        console.error('Error fetching road tax entries:', error);
        res.status(500).json({ message: 'Failed to fetch road tax entries' });
    }
});

//post road tax
app.post('/api/taxes', async (req, res) => {
    try {
        const newTax = new RoadTax(req.body);
        const savedTax = await newTax.save();
        res.status(201).json(savedTax);
    } catch (error) {
        console.error('Error adding road tax entry:', error);
        res.status(500).json({ message: 'Failed to add road tax entry' });
    }
});

//update road tax
app.put('/api/taxes/:id', async (req, res) => {
    try {
        const updatedTax = await RoadTax.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedTax) {
            return res.status(404).json({ message: 'Road tax entry not found' });
        }
        
        res.json(updatedTax);
    } catch (error) {
        console.error('Error updating road tax entry:', error);
        res.status(500).json({ message: 'Failed to update road tax entry' });
    }
});

//delete road tax
app.delete('/api/taxes/:id', async (req, res) => {
    try {
        const deletedTax = await RoadTax.findByIdAndDelete(req.params.id);
        
        if (!deletedTax) {
            return res.status(404).json({ message: 'Road tax entry not found' });
        }
        
        res.json({ message: 'Road tax entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting road tax entry:', error);
        res.status(500).json({ message: 'Failed to delete road tax entry' });
    }
});


// Serve the main HTML file for all routes (for SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});