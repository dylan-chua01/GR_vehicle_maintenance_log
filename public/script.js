document.addEventListener('DOMContentLoaded', function() {
    // API endpoints
    const API = {
        vehicles: '/api/vehicles',
        logs: '/api/logs',
        taxes: 'api/taxes',
        fuel: '/api/fuel',
        insurance: '/api/insurance',
        locations: '/api/locations',
    };

    // DOM elements
    const vehicleSelect = document.getElementById('vehicle-select');
    const vehicleForm = document.getElementById('vehicle-form');
    const toggleEditBtn = document.getElementById('toggle-edit');
    const saveVehicleBtn = document.getElementById('save-vehicle');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const addLogEntryBtn = document.getElementById('add-log-entry');
    const logEntriesContainer = document.getElementById('log-entries');
    const taxEntriesContainer = document.getElementById('tax-entries');
    const addTaxEntryBtn = document.getElementById('add-tax-entry');
    const taxModal = document.getElementById('tax-modal');
    const roadTaxForm = document.getElementById('road-tax-form');

    //fuel DOM elements
    const fuelEntriesContainer = document.getElementById('fuel-entries');
    const addFuelEntryBtn = document.getElementById('add-fuel-entry');
    const fuelModal = document.getElementById('fuel-modal');
    const fuelForm = document.getElementById('fuel-form');
    const cancelFuelBtn = document.getElementById('cancel-fuel');
    const fuelModalTitle = document.getElementById('fuel-modal-title');
    const fuelDateInput = document.getElementById('fuel-date');
    const fuelEntryIdInput = document.getElementById('fuel-entry-id');
    const fuelReceiptInput = document.getElementById('fuel-receipt');
    const fuelDriverInput = document.getElementById('fuel-driver');
    const fuelCostInput = document.getElementById('fuel-cost');
    const fuelAmountInput = document.getElementById('fuel-amount');
    const fuelNotesInput = document.getElementById('fuel-notes');

    //insurance DOM elements
    const insuranceEntriesContainer = document.getElementById('insurance-entries');
    const addInsuranceEntryBtn = document.getElementById('add-insurance-entry');
    const insuranceModal = document.getElementById('insurance-modal');
    const insuranceForm = document.getElementById('insurance-form');
    const cancelInsuranceBtn = document.getElementById('cancel-insurance');
    const insuranceModalTitle = document.getElementById('insurance-modal-title');

    //location DOM elements
    const locationEntriesContainer = document.getElementById('location-entries');
    const addLocationEntryBtn = document.getElementById('add-location-entry');
    const locationModal = document.getElementById('location-modal');
    const locationForm = document.getElementById('location-form');
    const cancelLocationBtn = document.getElementById('cancel-location');
    const locationModalTitle = document.getElementById('location-modal-title');
    

    
    // Modals
    const entryModal = document.getElementById('entry-modal');
    const vehicleModal = document.getElementById('vehicle-modal');
    const maintenanceForm = document.getElementById('maintenance-form');
    const newVehicleForm = document.getElementById('new-vehicle-form');
    
    // Current selected vehicle
    let currentVehicleId = null;
    
    // Initialize the application
    initApp();

    // Application initialization
    async function initApp() {
        try {
            setupEventListeners();
            await populateVehicleDropdown();
            
            // Show delete vehicle button
            addDeleteVehicleButton();

            if (currentVehicleId) {
                await displayLocationLogs(currentVehicleId);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('There was an error initializing the application. Please try again later.');
        }
    }

    // Add delete vehicle button to the vehicle info card
    function addDeleteVehicleButton() {
        const cardActions = document.querySelector('.vehicle-info .card-actions');
        
        // Check if button already exists
        if (!document.getElementById('delete-vehicle')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-vehicle';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Vehicle';
            deleteBtn.addEventListener('click', deleteVehicle);
            
            // Add the button to the card actions
            cardActions.appendChild(deleteBtn);
        }
    }

    // Populate vehicle dropdown with vehicles from API
    async function populateVehicleDropdown() {
        try {
            // Fetch vehicles from API
            const response = await fetch(API.vehicles);
            if (!response.ok) throw new Error('Failed to fetch vehicles');
            
            const vehicles = await response.json();
            
            // Clear existing options except the default and "Add New"
            while (vehicleSelect.options.length > 2) {
                vehicleSelect.remove(1);
            }
            
            // Make sure we have the "Add New" option at position 1
            if (vehicleSelect.options.length < 2 || vehicleSelect.options[1].value !== "new") {
                const newOption = document.createElement('option');
                newOption.value = "new";
                newOption.textContent = "+ Add New Vehicle";
                if (vehicleSelect.options.length > 1) {
                    vehicleSelect.insertBefore(newOption, vehicleSelect.options[1]);
                } else {
                    vehicleSelect.appendChild(newOption);
                }
            }
            
            // Add vehicle options
            vehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle._id;
                option.textContent = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.engine} ${vehicle.chasis} (${vehicle.plate})`;
                vehicleSelect.appendChild(option);
            });
            
            // Set default vehicle if available
            if (vehicles.length > 0) {
                vehicleSelect.value = vehicles[0]._id;
                currentVehicleId = vehicles[0]._id;
                await displayVehicleInfo(vehicles[0]._id);
                await displayMaintenanceLogs(vehicles[0]._id);
                await displayFuelLogs(vehicles[0]._id);
                await displayRoadTaxLogs(vehicles[0]._id);
                await displayInsuranceLogs(vehicles[0]._id);
            }
            
            console.log("Vehicle dropdown populated with", vehicleSelect.options.length, "options");
            
        } catch (error) {
            console.error('Error populating vehicle dropdown:', error);
            alert('Failed to load vehicles. Please refresh the page and try again.');
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Vehicle selection change
        vehicleSelect.addEventListener('change', handleVehicleSelect);
        
        // Vehicle info edit controls
        toggleEditBtn.addEventListener('click', toggleVehicleEditMode);
        saveVehicleBtn.addEventListener('click', saveVehicleInfo);
        cancelEditBtn.addEventListener('click', cancelVehicleEdit);
        
        // Maintenance log controls
        addLogEntryBtn.addEventListener('click', () => openEntryModal());
        
        // Maintenance form submission
        maintenanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveMaintenanceEntry();
        });
        
        document.getElementById('cancel-entry').addEventListener('click', closeEntryModal);
        
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', function() {
                entryModal.style.display = 'none';
                vehicleModal.style.display = 'none';
            });
        });

        // Road tax controls
        addTaxEntryBtn.addEventListener('click', () => openTaxModal());
        
        // Road tax form submission
        roadTaxForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveRoadTaxEntry();
        });
        document.getElementById('cancel-tax').addEventListener('click', closeTaxModal);
         
    // Add event delegation for road tax log actions
    taxEntriesContainer.addEventListener('click', function(e) {
        // Check if clicked element or its parent is an edit button
        const editBtn = e.target.closest('.edit-tax');
        if (editBtn) {
            const row = editBtn.closest('tr');
            const entryId = row.dataset.id;
            openTaxModal(entryId);
            return;
        }
        
        // Check if clicked element or its parent is a delete button
        const deleteBtn = e.target.closest('.delete-tax');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            const entryId = row.dataset.id;
            deleteRoadTaxEntry(entryId);
            return;
        }
    });

        // Fuel log controls
        addFuelEntryBtn.addEventListener('click', () => openFuelModal());
    fuelForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveFuelEntry();
    });
    cancelFuelBtn.addEventListener('click', closeFuelModal);

    // Event delegation for fuel log actions
    fuelEntriesContainer.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-fuel');
        if (editBtn) {
            const row = editBtn.closest('tr');
            const entryId = row.dataset.id;
            openFuelModal(entryId);
            return;
        }
        
        const deleteBtn = e.target.closest('.delete-fuel');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            const entryId = row.dataset.id;
            deleteFuelEntry(entryId);
            return;
        }
    });
    
        //insurance
        addInsuranceEntryBtn.addEventListener('click', () => openInsuranceModal());
        insuranceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInsuranceEntry();
        });
        cancelInsuranceBtn.addEventListener('click', closeInsuranceModal);

        // Add event delegation for insurance log actions
        insuranceEntriesContainer.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-insurance');
        if (editBtn) {
            const row = editBtn.closest('tr');
            const entryId = row.dataset.id;
            openInsuranceModal(entryId);
            return;
        }
        
        const deleteBtn = e.target.closest('.delete-insurance');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            const entryId = row.dataset.id;
            deleteInsuranceEntry(entryId);
            return;
        }
    });

    //location
    addLocationEntryBtn.addEventListener('click', () => openLocationModal());
    locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveLocationEntry();
    });
    cancelLocationBtn.addEventListener('click', closeLocationModal);

    // Add event delegation for location log actions
    locationEntriesContainer.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-location');
        if (editBtn) {
            const row = editBtn.closest('tr');
            const entryId = row.dataset.id;
            openLocationModal(entryId);
            return;
        }
        
        const deleteBtn = e.target.closest('.delete-location');
        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            const entryId = row.dataset.id;
            deleteLocationEntry(entryId);
            return;
        }
    });

        // Service description selection
        document.getElementById('service-description').addEventListener('change', function() {
            const otherField = document.getElementById('service-description-other');
            otherField.style.display = this.value === 'other' ? 'block' : 'none';
        });
        
        // New vehicle form submission
        newVehicleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVehicle();
        });
        
        document.getElementById('cancel-vehicle').addEventListener('click', closeVehicleModal);
        
        // Add event delegation for maintenance log actions
        logEntriesContainer.addEventListener('click', function(e) {
            // Check if clicked element or its parent is an edit button
            const editBtn = e.target.closest('.edit-entry');
            if (editBtn) {
                const row = editBtn.closest('tr');
                const entryId = row.dataset.id;
                openEntryModal(entryId);
                return;
            }
            
            // Check if clicked element or its parent is a delete button
            const deleteBtn = e.target.closest('.delete-entry');
            if (deleteBtn) {
                const row = deleteBtn.closest('tr');
                const entryId = row.dataset.id;
                deleteMaintenanceEntry(entryId);
                return;
            }
        });

        
    }

    // Handle vehicle selection change
    async function handleVehicleSelect() {
        const selectedValue = vehicleSelect.value;
        console.log("Vehicle selected:", selectedValue);
        
        if (selectedValue === 'new') {
            // Open add new vehicle modal
            openVehicleModal();
            // Reset selection
            vehicleSelect.value = currentVehicleId || '';
        } else if (selectedValue) {
            // Display selected vehicle info
            currentVehicleId = selectedValue;
            await displayVehicleInfo(selectedValue);
            await displayMaintenanceLogs(selectedValue);
            await displayRoadTaxLogs(selectedValue);
            await displayFuelLogs(selectedValue);
            await displayInsuranceLogs(selectedValue);
            await displayLocationLogs(selectedValue);
        }
    }

    // Display road tax logs for selected vehicle
    async function displayRoadTaxLogs(vehicleId) {
    try {
        // Clear existing tax entries
        taxEntriesContainer.innerHTML = '';
        
        // Fetch taxes from API
        const response = await fetch(`${API.vehicles}/${vehicleId}/taxes`);
        if (!response.ok) throw new Error('Failed to fetch road tax logs');
        
        const taxes = await response.json();
        
        // Generate tax entries
        if (taxes.length > 0) {
            taxes.forEach(tax => {
                const row = document.createElement('tr');
                row.dataset.id = tax._id;
                
                row.innerHTML = `
                    <td>${tax.taxId}</td>
                    <td>${new Date(tax.renewalDate).toISOString().split('T')[0]}</td>
                    <td>${new Date(tax.expiryDate).toISOString().split('T')[0]}</td>
                    <td>$${parseFloat(tax.cost || 0).toFixed(2)}</td>
                    <td>${tax.agent || ''}</td>
                    <td>
                        <button class="btn-icon edit-tax" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-tax" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                taxEntriesContainer.appendChild(row);
            });
        } else {
            // Show message if no taxes found
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" class="text-center">No road tax records found. Add your first entry!</td>';
            taxEntriesContainer.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error displaying road tax logs:', error);
        alert('Failed to load road tax logs. Please try again.');
        
        // Show empty state
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">Failed to load road tax records.</td>';
        taxEntriesContainer.appendChild(row);
    }
}

// Open road tax entry modal
async function openTaxModal(entryId) {
    // Set modal title based on mode (add or edit)
    document.getElementById('tax-modal-title').textContent = entryId ? 'Edit Road Tax Entry' : 'Add Road Tax Entry';
    
    // Clear form
    roadTaxForm.reset();
    
    if (entryId) {
        try {
            // Fetch the tax entry from API
            const response = await fetch(`${API.taxes}/${entryId}`);
            if (!response.ok) throw new Error('Failed to fetch road tax entry');
            
            const entry = await response.json();
            
            // Populate form with entry data
            document.getElementById('tax-id').value = entry.taxId;
            document.getElementById('renewal-date').value = new Date(entry.renewalDate).toISOString().split('T')[0];
            document.getElementById('expiry-date').value = new Date(entry.expiryDate).toISOString().split('T')[0];
            document.getElementById('tax-cost').value = entry.cost || 0;
            document.getElementById('tax-agent').value = entry.agent || '';
            document.getElementById('tax-notes').value = entry.notes || '';
            document.getElementById('tax-entry-id').value = entry._id;
            
        } catch (error) {
            console.error('Error fetching road tax entry:', error);
            alert('Failed to load road tax entry. Please try again.');
            closeTaxModal();
            return;
        }
    } else {
        // Set default values for a new entry
        document.getElementById('renewal-date').value = new Date().toISOString().split('T')[0];
        
        // Calculate default expiry date (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.getElementById('expiry-date').value = expiryDate.toISOString().split('T')[0];
        
        document.getElementById('tax-entry-id').value = '';
    }
    
    // Show modal
    taxModal.style.display = 'block';
}

//open fuel entry
async function openFuelModal(entryId) {
    fuelModalTitle.textContent = entryId ? 'Edit Fuel Entry' : 'Add Fuel Entry';
    fuelForm.reset();

    if (entryId) {
        try {
            const response = await fetch(`${API.fuel}/${entryId}`);
            if (!response.ok) throw new Error('Failed to fetch fuel entry');
            
            const entry = await response.json();
            
            // Populate form
            fuelReceiptInput.value = entry.receiptNumber || '';
            fuelDateInput.value = new Date(entry.date).toISOString().split('T')[0];
            fuelDriverInput.value = entry.driver || '';
            fuelCostInput.value = entry.cost || 0;
            fuelAmountInput.value = entry.amount || '';
            fuelNotesInput.value = entry.notes || '';
            fuelEntryIdInput.value = entry._id;
            
        } catch (error) {
            console.error('Error fetching fuel entry:', error);
            alert('Failed to load fuel entry. Please try again.');
            closeFuelModal();
            return;
        }
    } else {
        // Set default values for new entry
        fuelDateInput.value = new Date().toISOString().split('T')[0];
        fuelEntryIdInput.value = '';
    }
    
    fuelModal.style.display = 'block';
}

// Close fuel modal
function closeFuelModal() {
    fuelModal.style.display = 'none';
}

// Save fuel entry
async function saveFuelEntry() {
    const entryId = fuelEntryIdInput.value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeFuelModal();
        return;
    }
    
    const fuelData = {
        vehicleId: vehicleId,
        receiptNumber: fuelReceiptInput.value,
        date: fuelDateInput.value,
        driver: fuelDriverInput.value,
        cost: parseFloat(fuelCostInput.value) || 0,
        amount: fuelAmountInput.value,
        notes: fuelNotesInput.value
    };
    
    if (!fuelData.receiptNumber || !fuelData.date || !fuelData.driver) {
        alert('Please fill out all required fields.');
        return;
    }
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.fuel}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fuelData)
            });
        } else {
            // Create new entry
            response = await fetch(API.fuel, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fuelData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save fuel entry');
        
        await displayFuelLogs(vehicleId);
        closeFuelModal();
        alert(entryId ? 'Fuel entry updated successfully!' : 'Fuel entry added successfully!');
        
    } catch (error) {
        console.error('Error saving fuel entry:', error);
        alert('Failed to save fuel entry. Please try again.');
    }
}

// Display fuel logs
async function displayFuelLogs(vehicleId) {
    try {
        fuelEntriesContainer.innerHTML = '';
        
        const response = await fetch(`${API.vehicles}/${vehicleId}/fuel`);
        if (!response.ok) throw new Error('Failed to fetch fuel logs');
        
        const fuelLogs = await response.json();
        
        if (fuelLogs.length > 0) {
            fuelLogs.forEach(log => {
                const row = document.createElement('tr');
                row.dataset.id = log._id;
                
                row.innerHTML = `
                    <td>${log.receiptNumber || ''}</td>
                    <td>${new Date(log.date).toISOString().split('T')[0]}</td>
                    <td>${log.driver || ''}</td>
                    <td>$${parseFloat(log.cost || 0).toFixed(2)}</td>
                    <td>${log.amount || ''}</td>
                    <td>
                        <button class="btn-icon edit-fuel" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-fuel" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                fuelEntriesContainer.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" class="text-center">No fuel records found. Add your first entry!</td>';
            fuelEntriesContainer.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error displaying fuel logs:', error);
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">Failed to load fuel records.</td>';
        fuelEntriesContainer.appendChild(row);
    }
}

// Delete fuel entry
async function deleteFuelEntry(entryId) {
    if (confirm('Are you sure you want to delete this fuel record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.fuel}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete fuel entry');
            
            await displayFuelLogs(currentVehicleId);
            alert('Fuel record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting fuel entry:', error);
            alert('Failed to delete fuel record. Please try again.');
        }
    }
}

// Display location logs
async function displayLocationLogs(vehicleId) {
    try {
        console.log(`Fetching location logs for vehicle ${vehicleId}`); // Debug
        locationEntriesContainer.innerHTML = '';
        
        const response = await fetch(`${API.vehicles}/${vehicleId}/locations`);
        if (!response.ok) throw new Error('Failed to fetch location logs');
        
        const locations = await response.json();
        console.log("Location logs data:", locations); // Debug
        
        if (locations.length > 0) {
            locations.forEach(location => {
                const row = document.createElement('tr');
                row.dataset.id = location._id;
                
                row.innerHTML = `
                    <td>${new Date(location.fromDate).toISOString().split('T')[0]}</td>
                    <td>${new Date(location.toDate).toISOString().split('T')[0]}</td>
                    <td>${location.location || ''}</td>
                    <td>${location.agent || ''}</td>
                    <td>
                        <button class="btn-icon edit-location" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-location" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                locationEntriesContainer.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No location records found. Add your first entry!</td>';
            locationEntriesContainer.appendChild(row);
        }
    } catch (error) {
        console.error('Error displaying location logs:', error);
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">Failed to load location records.</td>';
        locationEntriesContainer.appendChild(row);
    }
}

async function openLocationModal(entryId) {
    locationModalTitle.textContent = entryId ? 'Edit Location Entry' : 'Add Location Entry';
    locationForm.reset();

    if (entryId) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`);
            if (!response.ok) throw new Error('Failed to fetch location entry');
            
            const entry = await response.json();
            
            // Populate form
            document.getElementById('location-from-date').value = new Date(entry.fromDate).toISOString().split('T')[0];
            document.getElementById('location-to-date').value = new Date(entry.toDate).toISOString().split('T')[0];
            document.getElementById('location').value = entry.location || '';
            document.getElementById('location-agent').value = entry.agent || '';
            document.getElementById('location-notes').value = entry.notes || '';
            document.getElementById('location-entry-id').value = entry._id;
            
        } catch (error) {
            console.error('Error fetching location entry:', error);
            alert('Failed to load location entry. Please try again.');
            closeLocationModal();
            return;
        }
    } else {
        // Set default values for new entry
        document.getElementById('location-from-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('location-entry-id').value = '';
    }
    
    locationModal.style.display = 'block';
}

function closeLocationModal() {
    locationModal.style.display = 'none';
}

async function saveLocationEntry() {
    const entryId = document.getElementById('location-entry-id').value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeLocationModal();
        return;
    }
    
    const locationData = {
        vehicleId: vehicleId,
        fromDate: document.getElementById('location-from-date').value,
        toDate: document.getElementById('location-to-date').value,
        location: document.getElementById('location').value,
        agent: document.getElementById('location-agent').value,
        notes: document.getElementById('location-notes').value
    };
    
    if (!locationData.fromDate || !locationData.toDate || !locationData.location) {
        alert('Please fill out all required fields.');
        return;
    }
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.locations}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        } else {
            // Create new entry
            response = await fetch(API.locations, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save location entry');
        
        await displayLocationLogs(vehicleId);
        closeLocationModal();
        alert(entryId ? 'Location entry updated successfully!' : 'Location entry added successfully!');
        
    } catch (error) {
        console.error('Error saving location entry:', error);
        alert('Failed to save location entry. Please try again.');
    }
}

async function deleteLocationEntry(entryId) {
    if (confirm('Are you sure you want to delete this location record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete location entry');
            
            await displayLocationLogs(currentVehicleId);
            alert('Location record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting location entry:', error);
            alert('Failed to delete location record. Please try again.');
        }
    }
}

async function openLocationModal(entryId) {
    locationModalTitle.textContent = entryId ? 'Edit Location Entry' : 'Add Location Entry';
    locationForm.reset();

    if (entryId) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`);
            if (!response.ok) throw new Error('Failed to fetch location entry');
            
            const entry = await response.json();
            
            // Populate form
            document.getElementById('location-from-date').value = new Date(entry.fromDate).toISOString().split('T')[0];
            document.getElementById('location-to-date').value = new Date(entry.toDate).toISOString().split('T')[0];
            document.getElementById('location').value = entry.location || '';
            document.getElementById('location-agent').value = entry.agent || '';
            document.getElementById('location-notes').value = entry.notes || '';
            document.getElementById('location-entry-id').value = entry._id;
            
        } catch (error) {
            console.error('Error fetching location entry:', error);
            alert('Failed to load location entry. Please try again.');
            closeLocationModal();
            return;
        }
    } else {
        // Set default values for new entry
        document.getElementById('location-from-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('location-entry-id').value = '';
    }
    
    locationModal.style.display = 'block';
}

function closeLocationModal() {
    locationModal.style.display = 'none';
}

async function saveLocationEntry() {
    const entryId = document.getElementById('location-entry-id').value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeLocationModal();
        return;
    }
    
    const locationData = {
        vehicleId: vehicleId,
        fromDate: document.getElementById('location-from-date').value,
        toDate: document.getElementById('location-to-date').value,
        location: document.getElementById('location').value,
        agent: document.getElementById('location-agent').value,
        notes: document.getElementById('location-notes').value
    };
    
    if (!locationData.fromDate || !locationData.toDate || !locationData.location) {
        alert('Please fill out all required fields.');
        return;
    }
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.locations}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        } else {
            // Create new entry
            response = await fetch(API.locations, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save location entry');
        
        await displayLocationLogs(vehicleId);
        closeLocationModal();
        alert(entryId ? 'Location entry updated successfully!' : 'Location entry added successfully!');
        
    } catch (error) {
        console.error('Error saving location entry:', error);
        alert('Failed to save location entry. Please try again.');
    }
}

async function deleteLocationEntry(entryId) {
    if (confirm('Are you sure you want to delete this location record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete location entry');
            
            await displayLocationLogs(currentVehicleId);
            alert('Location record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting location entry:', error);
            alert('Failed to delete location record. Please try again.');
        }
    }
}

async function openLocationModal(entryId) {
    locationModalTitle.textContent = entryId ? 'Edit Location Entry' : 'Add Location Entry';
    locationForm.reset();

    if (entryId) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`);
            if (!response.ok) throw new Error('Failed to fetch location entry');
            
            const entry = await response.json();
            
            // Populate form
            document.getElementById('location-from-date').value = new Date(entry.fromDate).toISOString().split('T')[0];
            document.getElementById('location-to-date').value = new Date(entry.toDate).toISOString().split('T')[0];
            document.getElementById('location').value = entry.location || '';
            document.getElementById('location-agent').value = entry.agent || '';
            document.getElementById('location-notes').value = entry.notes || '';
            document.getElementById('location-entry-id').value = entry._id;
            
        } catch (error) {
            console.error('Error fetching location entry:', error);
            alert('Failed to load location entry. Please try again.');
            closeLocationModal();
            return;
        }
    } else {
        // Set default values for new entry
        document.getElementById('location-from-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('location-entry-id').value = '';
    }
    
    locationModal.style.display = 'block';
}

function closeLocationModal() {
    locationModal.style.display = 'none';
}

async function saveLocationEntry() {
    const entryId = document.getElementById('location-entry-id').value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeLocationModal();
        return;
    }
    
    const locationData = {
        vehicleId: vehicleId,
        fromDate: document.getElementById('location-from-date').value,
        toDate: document.getElementById('location-to-date').value,
        location: document.getElementById('location').value,
        agent: document.getElementById('location-agent').value,
        notes: document.getElementById('location-notes').value
    };
    
    if (!locationData.fromDate || !locationData.toDate || !locationData.location) {
        alert('Please fill out all required fields.');
        return;
    }
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.locations}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        } else {
            // Create new entry
            response = await fetch(API.locations, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save location entry');
        
        await displayLocationLogs(vehicleId);
        closeLocationModal();
        alert(entryId ? 'Location entry updated successfully!' : 'Location entry added successfully!');
        
    } catch (error) {
        console.error('Error saving location entry:', error);
        alert('Failed to save location entry. Please try again.');
    }
}

async function deleteLocationEntry(entryId) {
    if (confirm('Are you sure you want to delete this location record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.locations}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete location entry');
            
            await displayLocationLogs(currentVehicleId);
            alert('Location record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting location entry:', error);
            alert('Failed to delete location record. Please try again.');
        }
    }
}

// Close road tax entry modal
function closeTaxModal() {
    taxModal.style.display = 'none';
}

// Save road tax entry
async function saveRoadTaxEntry() {
    const entryId = document.getElementById('tax-entry-id').value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeTaxModal();
        return;
    }
    
    const taxId = document.getElementById('tax-id').value;
    const renewalDate = document.getElementById('renewal-date').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const taxCost = document.getElementById('tax-cost').value || 0;
    const taxAgent = document.getElementById('tax-agent').value;
    const taxNotes = document.getElementById('tax-notes').value;
    
    if (!taxId || !renewalDate || !expiryDate) {
        alert('Please fill out all required fields.');
        return;
    }
    
    // Prepare tax data
    const taxData = {
        vehicleId: vehicleId,
        taxId: taxId,
        renewalDate: renewalDate,
        expiryDate: expiryDate,
        cost: parseFloat(taxCost),
        agent: taxAgent,
        notes: taxNotes
    };
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.taxes}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taxData)
            });
        } else {
            // Create new entry
            response = await fetch(API.taxes, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taxData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save road tax entry');
        
        // Refresh tax logs
        await displayRoadTaxLogs(vehicleId);
        
        // Close modal
        closeTaxModal();
        
        // Show success message
        alert(entryId ? 'Road tax entry updated successfully!' : 'Road tax entry added successfully!');
        
    } catch (error) {
        console.error('Error saving road tax entry:', error);
        alert('Failed to save road tax entry. Please try again.');
    }
}

// Delete road tax entry
async function deleteRoadTaxEntry(entryId) {
    if (confirm('Are you sure you want to delete this road tax record? This action cannot be undone.')) {
        try {
            // Delete entry via API
            const response = await fetch(`${API.taxes}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete road tax entry');
            
            // Refresh road tax logs
            await displayRoadTaxLogs(currentVehicleId);
            
            // Show success message
            alert('Road tax record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting road tax entry:', error);
            alert('Failed to delete road tax record. Please try again.');
        }
    }
}

// IMPORTANT: Replace the incomplete deleteTaxEntry function at the end of script.js with this:
function deleteTaxEntry(entryId) {
    if (confirm('Are you sure you want to delete this road tax record? This action cannot be undone.')) {
        deleteRoadTaxEntry(entryId);
    }
}

    // Display vehicle information
    async function displayVehicleInfo(vehicleId) {
        try {
            const response = await fetch(`${API.vehicles}/${vehicleId}`);
            if (!response.ok) throw new Error('Failed to fetch vehicle information');
            
            const vehicle = await response.json();

            // Helper function to safely set value
        function setValue(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            } else {
                console.warn(`Element with ID ${id} not found`);
            }
        }
            
            // Fill in vehicle information
            document.getElementById('input-year').value = vehicle.year || '';
            document.getElementById('input-brand').value = vehicle.make || '';
            document.getElementById('input-model').value = vehicle.model || '';
            document.getElementById('input-plate').value = vehicle.plate || '';
            document.getElementById('input-engine').value = vehicle.engine || '';
            document.getElementById('input-chasis').value = vehicle.chasis || '';
            document.getElementById('input-status').value = vehicle.status || 'active';
            document.getElementById('input-fuel-type').value = vehicle.fuelType || 'regular';
            document.getElementById('input-acquisition-date').value = vehicle.acquisitionDate ? new Date(vehicle.acquisitionDate).toISOString().split('T')[0] : '';
            document.getElementById('input-mileage').value = vehicle.currentMileage || 0;
            document.getElementById('input-last-service').value = vehicle.lastService ? new Date(vehicle.lastService).toISOString().split('T')[0] : '';
            document.getElementById('input-next-service').value = vehicle.nextService ? new Date(vehicle.nextService).toISOString().split('T')[0] : '';
            
        } catch (error) {
            console.error('Error displaying vehicle info:', error);
            alert('Failed to load vehicle information. Please try again.');
        }
    }

    // Display maintenance logs for selected vehicle
    async function displayMaintenanceLogs(vehicleId) {
        try {
            // Clear existing log entries
            logEntriesContainer.innerHTML = '';
            
            // Fetch logs from API
            const response = await fetch(`${API.vehicles}/${vehicleId}/logs`);
            if (!response.ok) throw new Error('Failed to fetch maintenance logs');
            
            const logs = await response.json();
            
            // Generate log entries
            if (logs.length > 0) {
                logs.forEach(log => {
                    const row = document.createElement('tr');
                    row.dataset.id = log._id;
                    
                    row.innerHTML = `
                        <td>${new Date(log.date).toISOString().split('T')[0]}</td>
                        <td>${log.description}</td>
                        <td>${Number(log.odometer).toLocaleString()}</td>
                        <td>${log.serviceProvider || ''}</td>
                        <td>$${parseFloat(log.cost || 0).toFixed(2)}</td>
                        <td>${log.nextServiceDue ? new Date(log.nextServiceDue).toISOString().split('T')[0] : ''}</td>
                        <td>
                            <button class="btn-icon edit-entry" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete-entry" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    logEntriesContainer.appendChild(row);
                });
            } else {
                // Show message if no logs found
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" class="text-center">No maintenance records found. Add your first entry!</td>';
                logEntriesContainer.appendChild(row);
            }
            
        } catch (error) {
            console.error('Error displaying maintenance logs:', error);
            alert('Failed to load maintenance logs. Please try again.');
            
            // Show empty state
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">Failed to load maintenance records.</td>';
            logEntriesContainer.appendChild(row);
        }
    }

    // Toggle vehicle information edit mode
    function toggleVehicleEditMode() {
        const formInputs = vehicleForm.querySelectorAll('.form-input');
        formInputs.forEach(input => {
            input.disabled = !input.disabled;
        });
        
        toggleEditBtn.style.display = 'none';
        saveVehicleBtn.style.display = 'inline-block';
        cancelEditBtn.style.display = 'inline-block';
        
        // Hide delete button in edit mode
        const deleteVehicleBtn = document.getElementById('delete-vehicle');
        if (deleteVehicleBtn) {
            deleteVehicleBtn.style.display = 'none';
        }
    }

    // Save vehicle information
    async function saveVehicleInfo() {
        try {
            const vehicleId = currentVehicleId;
            
            if (!vehicleId) {
                alert('No vehicle selected. Please select a vehicle first.');
                return;
            }
            
            // Gather vehicle information from form
            const vehicleData = {
                year: parseInt(document.getElementById('input-year').value),
                make: document.getElementById('input-brand').value,
                model: document.getElementById('input-model').value,
                plate: document.getElementById('input-plate').value,
                engine: document.getElementById('input-engine').value,
                chasis: document.getElementById('input-chasis').value,
                status: document.getElementById('input-status').value,
                fuelType: document.getElementById('input-fuel-type').value,
                acquisitionDate: document.getElementById('input-acquisition-date').value,
                currentMileage: parseInt(document.getElementById('input-mileage').value) || 0,
                lastService: document.getElementById('input-last-service').value,
                nextService: document.getElementById('input-next-service').value
            };
            
            // Update vehicle via API
            const response = await fetch(`${API.vehicles}/${vehicleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });
            
            if (!response.ok) throw new Error('Failed to update vehicle');
            
            // Update vehicle dropdown
            await populateVehicleDropdown();
            
            // Exit edit mode
            exitVehicleEditMode();
            
            // Show success message
            alert('Vehicle information saved successfully!');
            
        } catch (error) {
            console.error('Error saving vehicle info:', error);
            alert('Failed to save vehicle information. Please try again.');
        }
    }

    // Cancel vehicle edit
    async function cancelVehicleEdit() {
        // Restore original values
        await displayVehicleInfo(currentVehicleId);
        
        // Exit edit mode
        exitVehicleEditMode();
    }
    
    // Exit vehicle edit mode (common function)
    function exitVehicleEditMode() {
        // Disable all form inputs
        const formInputs = vehicleForm.querySelectorAll('.form-input');
        formInputs.forEach(input => {
            input.disabled = true;
        });
        
        // Reset button display
        toggleEditBtn.style.display = 'inline-block';
        saveVehicleBtn.style.display = 'none';
        cancelEditBtn.style.display = 'none';
        
        // Show delete button again
        const deleteVehicleBtn = document.getElementById('delete-vehicle');
        if (deleteVehicleBtn) {
            deleteVehicleBtn.style.display = 'inline-block';
        }
    }

    // Delete vehicle
    async function deleteVehicle() {
        const vehicleId = currentVehicleId;
        
        if (!vehicleId) {
            alert('No vehicle selected. Please select a vehicle first.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this vehicle? All maintenance records associated with this vehicle will also be deleted. This action cannot be undone.')) {
            try {
                // Delete vehicle via API
                const response = await fetch(`${API.vehicles}/${vehicleId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete vehicle');
                
                // Update vehicle dropdown
                await populateVehicleDropdown();
                
                // Show success message
                alert('Vehicle and its maintenance records deleted successfully!');
                
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                alert('Failed to delete vehicle. Please try again.');
            }
        }
    }

    // Open maintenance entry modal
    async function openEntryModal(entryId) {
        // Set modal title based on mode (add or edit)
        document.getElementById('modal-title').textContent = entryId ? 'Edit Maintenance Entry' : 'Add Maintenance Entry';
        
        // Clear form
        maintenanceForm.reset();
        document.getElementById('service-description-other').style.display = 'none';
        
        if (entryId) {
            try {
                // Fetch the log entry from API
                const response = await fetch(`${API.logs}/${entryId}`);
                if (!response.ok) throw new Error('Failed to fetch maintenance log');
                
                const entry = await response.json();
                
                // Populate form with entry data
                document.getElementById('service-date').value = new Date(entry.date).toISOString().split('T')[0];
                document.getElementById('service-odometer').value = entry.odometer;
                
                // Handle service description
                const descriptionSelect = document.getElementById('service-description');
                const descriptionOther = document.getElementById('service-description-other');
                
                // Check if the description is in the predefined options
                const descriptionOption = Array.from(descriptionSelect.options).find(option => 
                    option.value && option.value !== 'other' && entry.description.includes(option.value)
                );
                
                if (descriptionOption) {
                    descriptionSelect.value = descriptionOption.value;
                    descriptionOther.style.display = 'none';
                } else {
                    descriptionSelect.value = 'other';
                    descriptionOther.value = entry.description;
                    descriptionOther.style.display = 'block';
                }
                
                document.getElementById('service-provider').value = entry.serviceProvider || '';
                document.getElementById('service-cost').value = entry.cost || 0;
                document.getElementById('service-next-due').value = entry.nextServiceDue ? new Date(entry.nextServiceDue).toISOString().split('T')[0] : '';
                document.getElementById('service-notes').value = entry.notes || '';
                document.getElementById('entry-id').value = entry._id;
                
            } catch (error) {
                console.error('Error fetching maintenance entry:', error);
                alert('Failed to load maintenance entry. Please try again.');
                closeEntryModal();
                return;
            }
        } else {
            // Set default values for a new entry
            document.getElementById('service-date').value = new Date().toISOString().split('T')[0];
            
            try {
                // Get the current vehicle data
                const response = await fetch(`${API.vehicles}/${currentVehicleId}`);
                if (response.ok) {
                    const vehicle = await response.json();
                    document.getElementById('service-odometer').value = vehicle.currentMileage || 0;
                }
            } catch (error) {
                console.error('Error fetching vehicle mileage:', error);
                // Continue without setting mileage
            }
            
            document.getElementById('entry-id').value = '';
        }
        
        // Show modal
        entryModal.style.display = 'block';
    }

    // Close maintenance entry modal
    function closeEntryModal() {
        entryModal.style.display = 'none';
    }

    // Save maintenance entry
    async function saveMaintenanceEntry() {
        const entryId = document.getElementById('entry-id').value;
        const vehicleId = currentVehicleId;
        
        if (!vehicleId) {
            alert('Please select a vehicle first.');
            closeEntryModal();
            return;
        }
        
        const serviceDate = document.getElementById('service-date').value;
        const serviceOdometer = document.getElementById('service-odometer').value;
        
        // Get the service description (handle 'other' option)
        let serviceDescription = document.getElementById('service-description').value;
        if (serviceDescription === 'other') {
            serviceDescription = document.getElementById('service-description-other').value;
        }
        
        if (!serviceDescription) {
            alert('Please enter a service description.');
            return;
        }
        
        const serviceProvider = document.getElementById('service-provider').value;
        const serviceCost = document.getElementById('service-cost').value || 0;
        const serviceNextDue = document.getElementById('service-next-due').value;
        const serviceNotes = document.getElementById('service-notes').value;
        
        // Prepare log data
        const logData = {
            vehicleId: vehicleId,
            date: serviceDate,
            description: serviceDescription,
            odometer: parseInt(serviceOdometer),
            serviceProvider: serviceProvider,
            cost: parseFloat(serviceCost),
            nextServiceDue: serviceNextDue,
            notes: serviceNotes
        };
        
        try {
            let response;
            
            if (entryId) {
                // Update existing entry
                response = await fetch(`${API.logs}/${entryId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logData)
                });
            } else {
                // Create new entry
                response = await fetch(API.logs, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logData)
                });
            }
            
            if (!response.ok) throw new Error('Failed to save maintenance entry');
            
            // Refresh vehicle and maintenance logs
            await displayVehicleInfo(vehicleId);
            await displayMaintenanceLogs(vehicleId);
            
            // Close modal
            closeEntryModal();
            
            // Show success message
            alert(entryId ? 'Maintenance entry updated successfully!' : 'Maintenance entry added successfully!');
            
        } catch (error) {
            console.error('Error saving maintenance entry:', error);
            alert('Failed to save maintenance entry. Please try again.');
        }
    }

    // Delete maintenance entry
    async function deleteMaintenanceEntry(entryId) {
        if (confirm('Are you sure you want to delete this maintenance record? This action cannot be undone.')) {
            try {
                // Delete entry via API
                const response = await fetch(`${API.logs}/${entryId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete maintenance entry');
                
                // Refresh vehicle and maintenance logs
                await displayVehicleInfo(currentVehicleId);
                await displayMaintenanceLogs(currentVehicleId);
                
                // Show success message
                alert('Maintenance record deleted successfully!');
                
            } catch (error) {
                console.error('Error deleting maintenance entry:', error);
                alert('Failed to delete maintenance record. Please try again.');
            }
        }
    }

    // Open vehicle modal
    function openVehicleModal(vehicleId) {
        // Set modal title
        document.getElementById('vehicle-modal-title').textContent = vehicleId ? 'Edit Vehicle' : 'Add New Vehicle';
        
        // Clear form
        newVehicleForm.reset();
        
        if (vehicleId) {
            // This would be for editing an existing vehicle, but we're handling that differently
            // through the main vehicle form
            document.getElementById('edit-vehicle-id').value = vehicleId;
        } else {
            // Set default values for new vehicle
            document.getElementById('new-vehicle-year').value = new Date().getFullYear();
            document.getElementById('edit-vehicle-id').value = '';
        }
        
        // Show modal
        vehicleModal.style.display = 'block';
    }

    // Close vehicle modal
    function closeVehicleModal() {
        vehicleModal.style.display = 'none';
    }

    // Save vehicle from the modal (for new vehicles)
    async function saveVehicle() {
        try {
            const vehicleId = document.getElementById('edit-vehicle-id').value;
            const year = parseInt(document.getElementById('new-vehicle-year').value);
            const make = document.getElementById('new-vehicle-make').value;
            const model = document.getElementById('new-vehicle-model').value;
            const plate = document.getElementById('new-vehicle-plate').value;
            const engine = document.getElementById('new-vehicle-engine').value;
            const chasis = document.getElementById('new-vehicle-chasis').value;
            const status = document.getElementById('new-vehicle-status').value;
            
            // Validation
            if (!year || !make || !model || !plate) {
                alert('Please fill out all required fields.');
                return;
            }
            
            // Prepare vehicle data
            const vehicleData = {
                year: year,
                make: make,
                model: model,
                plate: plate,
                engine: engine,
                chasis: chasis,
                status: status,
                fuelType: "regular",
                acquisitionDate: new Date().toISOString().split('T')[0],
                currentMileage: 0
            };
            
            // Create new vehicle via API
            const response = await fetch(API.vehicles, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });
            
            if (!response.ok) throw new Error('Failed to create vehicle');
            
            const newVehicle = await response.json();
            
            // Update vehicle dropdown
            await populateVehicleDropdown();
            
            // Select the new vehicle
            vehicleSelect.value = newVehicle._id;
            currentVehicleId = newVehicle._id;
            await displayVehicleInfo(newVehicle._id);
            await displayMaintenanceLogs(newVehicle._id);
            
            // Close modal
            closeVehicleModal();
            
            // Show success message
            alert('Vehicle added successfully!');
            
        } catch (error) {
            console.error('Error saving vehicle:', error);
            alert('Failed to save vehicle. Please try again.');
        }
    }
    // Display insurance logs
    async function displayInsuranceLogs(vehicleId) {
    try {
        insuranceEntriesContainer.innerHTML = '';
        
        const response = await fetch(`${API.vehicles}/${vehicleId}/insurance`);
        if (!response.ok) throw new Error('Failed to fetch insurance logs');
        
        const insuranceLogs = await response.json();
        
        if (insuranceLogs.length > 0) {
            insuranceLogs.forEach(insurance => {
                const row = document.createElement('tr');
                row.dataset.id = insurance._id;
                
                row.innerHTML = `
                    <td>${insurance.insuranceId || ''}</td>
                    <td>${insurance.provider || ''}</td>
                    <td>${new Date(insurance.renewalDate).toISOString().split('T')[0]}</td>
                    <td>${new Date(insurance.expiryDate).toISOString().split('T')[0]}</td>
                    <td>$${parseFloat(insurance.cost || 0).toFixed(2)}</td>
                    <td>${insurance.agent || ''}</td>
                    <td>
                        <button class="btn-icon edit-insurance" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-insurance" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                insuranceEntriesContainer.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">No insurance records found. Add your first entry!</td>';
            insuranceEntriesContainer.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error displaying insurance logs:', error);
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">Failed to load insurance records.</td>';
        insuranceEntriesContainer.appendChild(row);
    }
}

    // Open insurance modal
    async function openInsuranceModal(entryId) {
        insuranceModalTitle.textContent = entryId ? 'Edit Insurance Entry' : 'Add Insurance Entry';
        insuranceForm.reset();
    
        if (entryId) {
            try {
                const response = await fetch(`${API.insurance}/${entryId}`);
                if (!response.ok) throw new Error('Failed to fetch insurance entry');
                
                const entry = await response.json();
                
                // Populate form
                document.getElementById('insurance-id').value = entry.insuranceId || '';
                document.getElementById('insurance-provider').value = entry.provider || '';
                document.getElementById('insurance-renewal-date').value = new Date(entry.renewalDate).toISOString().split('T')[0];
                document.getElementById('insurance-expiry-date').value = new Date(entry.expiryDate).toISOString().split('T')[0];
                document.getElementById('insurance-cost').value = entry.cost || 0;
                document.getElementById('insurance-agent').value = entry.agent || '';
                document.getElementById('insurance-notes').value = entry.notes || '';
                document.getElementById('insurance-entry-id').value = entry._id;
                
            } catch (error) {
                console.error('Error fetching insurance entry:', error);
                alert('Failed to load insurance entry. Please try again.');
                closeInsuranceModal();
                return;
            }
        } else {
            // Set default values for new entry
            document.getElementById('insurance-renewal-date').value = new Date().toISOString().split('T')[0];
            
            // Calculate default expiry date (1 year from now)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            document.getElementById('insurance-expiry-date').value = expiryDate.toISOString().split('T')[0];
            
            document.getElementById('insurance-entry-id').value = '';
        }
        
        insuranceModal.style.display = 'block';
    }

// Close insurance modal
function closeInsuranceModal() {
    insuranceModal.style.display = 'none';
}

// Save insurance entry
async function saveInsuranceEntry() {
    const entryId = document.getElementById('insurance-entry-id').value;
    const vehicleId = currentVehicleId;
    
    if (!vehicleId) {
        alert('Please select a vehicle first.');
        closeInsuranceModal();
        return;
    }
    
    const insuranceData = {
        vehicleId: vehicleId,
        insuranceId: document.getElementById('insurance-id').value,
        provider: document.getElementById('insurance-provider').value,
        renewalDate: document.getElementById('insurance-renewal-date').value,
        expiryDate: document.getElementById('insurance-expiry-date').value,
        cost: parseFloat(document.getElementById('insurance-cost').value) || 0,
        agent: document.getElementById('insurance-agent').value,
        notes: document.getElementById('insurance-notes').value
    };
    
    if (!insuranceData.insuranceId || !insuranceData.provider || !insuranceData.renewalDate || !insuranceData.expiryDate) {
        alert('Please fill out all required fields.');
        return;
    }
    
    try {
        let response;
        
        if (entryId) {
            // Update existing entry
            response = await fetch(`${API.insurance}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(insuranceData)
            });
        } else {
            // Create new entry
            response = await fetch(API.insurance, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(insuranceData)
            });
        }
        
        if (!response.ok) throw new Error('Failed to save insurance entry');
        
        await displayInsuranceLogs(vehicleId);
        closeInsuranceModal();
        alert(entryId ? 'Insurance entry updated successfully!' : 'Insurance entry added successfully!');
        
    } catch (error) {
        console.error('Error saving insurance entry:', error);
        alert('Failed to save insurance entry. Please try again.');
    }
}

// Delete insurance entry
async function deleteInsuranceEntry(entryId) {
    if (confirm('Are you sure you want to delete this insurance record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.insurance}/${entryId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete insurance entry');
            
            await displayInsuranceLogs(currentVehicleId);
            alert('Insurance record deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting insurance entry:', error);
            alert('Failed to delete insurance record. Please try again.');
        }
    }
}
});




function deleteTaxEntry(entryId) {
    // Delete from database and update UI
}