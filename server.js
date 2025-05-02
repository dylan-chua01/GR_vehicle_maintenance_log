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
const MONGODB_URI = process.env.MONGODB_URI;

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
    engine: String,
    status: { type: String, default: 'active' },
    fuelType: String,
    
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
const roadTaxSchema = new mongoose.Schema({
    vehicleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vehicle',
        required: true
    },
    taxId: { type: String, required: true },
    renewalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    cost: { type: Number, required: true },
    agent: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

// fuel log schema
const fuelLogSchema = new mongoose.Schema({
    vehicleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vehicle',
        required: true
    },
    receiptNumber: { type: String, required: true },
    date: { type: Date, required: true },
    driver: { type: String, required: true },
    cost: { type: Number, required: true },
    amount: { type: String, required: true },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

// insurance schema
const insuranceSchema = new mongoose.Schema({
    vehicleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vehicle',
        required: true
    },
    insuranceId: { type: String, required: true },
    provider: { type: String, required: true },
    renewalDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    cost: { type: Number, required: true },
    agent: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

// Create models
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
const RoadTax = mongoose.model('RoadTax', roadTaxSchema);
const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
const Insurance = mongoose.model('Insurance', insuranceSchema);

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
        // Simple validation
        if (!req.body.engine) {
            return res.status(400).json({ message: 'Engine information is required' });
        }
        
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

// Delete vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
        
        if (!deletedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        // Delete all associated records
        await Promise.all([
            MaintenanceLog.deleteMany({ vehicleId: req.params.id }),
            RoadTax.deleteMany({ vehicleId: req.params.id }),
            FuelLog.deleteMany({ vehicleId: req.params.id })  // Add this line
        ]);
        
        res.json({ message: 'Vehicle and all associated records deleted successfully' });
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

// GET road tax logs for a vehicle
app.get('/api/vehicles/:id/taxes', async (req, res) => {
    try {
        const taxes = await RoadTax.find({ 
            vehicleId: req.params.id 
        }).sort({ expiryDate: -1 });
        
        res.json(taxes);
    } catch (error) {
        console.error('Error fetching road tax logs:', error);
        res.status(500).json({ message: 'Failed to fetch road tax logs' });
    }
});

// GET a specific road tax entry
app.get('/api/taxes/:id', async (req, res) => {
    try {
        const tax = await RoadTax.findById(req.params.id);
        
        if (!tax) {
            return res.status(404).json({ message: 'Road tax entry not found' });
        }
        
        res.json(tax);
    } catch (error) {
        console.error('Error fetching road tax entry:', error);
        res.status(500).json({ message: 'Failed to fetch road tax entry' });
    }
});

// POST a new road tax entry
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

// PUT (update) a road tax entry
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

// DELETE a road tax entry
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

// GET fuel logs for a vehicle
app.get('/api/vehicles/:id/fuel', async (req, res) => {
    try {
        const fuelLogs = await FuelLog.find({ 
            vehicleId: req.params.id 
        }).sort({ date: -1 });
        
        res.json(fuelLogs);
    } catch (error) {
        console.error('Error fetching fuel logs:', error);
        res.status(500).json({ message: 'Failed to fetch fuel logs' });
    }
});

// GET a specific fuel log entry
app.get('/api/fuel/:id', async (req, res) => {
    try {
        const fuelLog = await FuelLog.findById(req.params.id);
        
        if (!fuelLog) {
            return res.status(404).json({ message: 'Fuel log entry not found' });
        }
        
        res.json(fuelLog);
    } catch (error) {
        console.error('Error fetching fuel log entry:', error);
        res.status(500).json({ message: 'Failed to fetch fuel log entry' });
    }
});

// POST a new fuel log entry
app.post('/api/fuel', async (req, res) => {
    try {
        const newFuelLog = new FuelLog(req.body);
        const savedFuelLog = await newFuelLog.save();
        
        res.status(201).json(savedFuelLog);
    } catch (error) {
        console.error('Error adding fuel log entry:', error);
        res.status(500).json({ message: 'Failed to add fuel log entry' });
    }
});

// PUT (update) a fuel log entry
app.put('/api/fuel/:id', async (req, res) => {
    try {
        const updatedFuelLog = await FuelLog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedFuelLog) {
            return res.status(404).json({ message: 'Fuel log entry not found' });
        }
        
        res.json(updatedFuelLog);
    } catch (error) {
        console.error('Error updating fuel log entry:', error);
        res.status(500).json({ message: 'Failed to update fuel log entry' });
    }
});

// DELETE a fuel log entry
app.delete('/api/fuel/:id', async (req, res) => {
    try {
        const deletedFuelLog = await FuelLog.findByIdAndDelete(req.params.id);
        
        if (!deletedFuelLog) {
            return res.status(404).json({ message: 'Fuel log entry not found' });
        }
        
        res.json({ message: 'Fuel log entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting fuel log entry:', error);
        res.status(500).json({ message: 'Failed to delete fuel log entry' });
    }
});

// GET insurance logs for a vehicle
app.get('/api/vehicles/:id/insurance', async (req, res) => {
    try {
        const insuranceLogs = await Insurance.find({ 
            vehicleId: req.params.id 
        }).sort({ expiryDate: -1 });
        
        res.json(insuranceLogs);
    } catch (error) {
        console.error('Error fetching insurance logs:', error);
        res.status(500).json({ message: 'Failed to fetch insurance logs' });
    }
});

// GET a specific insurance entry
app.get('/api/insurance/:id', async (req, res) => {
    try {
        const insurance = await Insurance.findById(req.params.id);
        
        if (!insurance) {
            return res.status(404).json({ message: 'Insurance entry not found' });
        }
        
        res.json(insurance);
    } catch (error) {
        console.error('Error fetching insurance entry:', error);
        res.status(500).json({ message: 'Failed to fetch insurance entry' });
    }
});

// POST a new insurance entry
app.post('/api/insurance', async (req, res) => {
    try {
        const newInsurance = new Insurance(req.body);
        const savedInsurance = await newInsurance.save();
        
        res.status(201).json(savedInsurance);
    } catch (error) {
        console.error('Error adding insurance entry:', error);
        res.status(500).json({ message: 'Failed to add insurance entry' });
    }
});

// PUT (update) an insurance entry
app.put('/api/insurance/:id', async (req, res) => {
    try {
        const updatedInsurance = await Insurance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedInsurance) {
            return res.status(404).json({ message: 'Insurance entry not found' });
        }
        
        res.json(updatedInsurance);
    } catch (error) {
        console.error('Error updating insurance entry:', error);
        res.status(500).json({ message: 'Failed to update insurance entry' });
    }
});

// DELETE an insurance entry
app.delete('/api/insurance/:id', async (req, res) => {
    try {
        const deletedInsurance = await Insurance.findByIdAndDelete(req.params.id);
        
        if (!deletedInsurance) {
            return res.status(404).json({ message: 'Insurance entry not found' });
        }
        
        res.json({ message: 'Insurance entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting insurance entry:', error);
        res.status(500).json({ message: 'Failed to delete insurance entry' });
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