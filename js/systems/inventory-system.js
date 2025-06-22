// ============== INVENTORY SYSTEM MODULE ============== //

import InteractiveAdventure from "../core/main.js"; // For StateManager, UIManager, DataLoader

/**
 * @class InventorySystem
 * @description Manages the player's inventory, including adding, removing, and using items.
 */
class InventorySystem {
    /**
     * @constructor
     * @param {DataLoader} dataLoader - Instance of DataLoader for fetching item definitions.
     * @param {StateManager} stateManager - Instance of StateManager to interact with game state.
     * @param {UIManager} uiManager - Instance of UIManager to update inventory UI.
     */
    constructor(dataLoader, stateManager, uiManager) {
        this.dataLoader = dataLoader;
        this.stateManager = stateManager;
        this.uiManager = uiManager;

        this.itemsData = {}; // Stores definitions of all available items, keyed by itemId
        this.playerInventory = this.stateManager.getGameState().inventory; // Direct reference to inventory part of game state

        // Ensure playerInventory structure exists in gameState
        if (!this.playerInventory) {
            this.stateManager.getGameState().inventory = { items: [], /* gold: 0, */ capacity: this.stateManager.getGameConstants().MAX_INVENTORY_SLOTS || 20 };
            this.playerInventory = this.stateManager.getGameState().inventory;
        }
        if (!this.playerInventory.items) this.playerInventory.items = [];
        if (this.playerInventory.capacity === undefined) {
            this.playerInventory.capacity = this.stateManager.getGameConstants().MAX_INVENTORY_SLOTS || 20;
        }


        console.log("InventorySystem initialized.");
    }

    /**
     * @method loadItemsData
     * @description Loads item definitions from a JSON file.
     * @param {string} filePath - The path to the JSON file containing item data.
     * @returns {Promise<void>}
     */
    async loadItemsData(filePath) {
        try {
            console.log(`InventorySystem: Loading item definitions from ${filePath}...`);
            const rawItemsData = await this.dataLoader.loadJSON(filePath);
            if (rawItemsData && Array.isArray(rawItemsData.items)) {
                rawItemsData.items.forEach(itemDef => {
                    this.itemsData[itemDef.id] = itemDef;
                });
                console.log(`InventorySystem: ${Object.keys(this.itemsData).length} item definitions loaded.`);
            } else {
                console.error("InventorySystem: Item data is not in the expected format (array of items).", rawItemsData);
                throw new Error("Invalid item data format.");
            }
        } catch (error) {
            console.error(`InventorySystem: Error loading item definitions from ${filePath}:`, error);
            InteractiveAdventure.errorHandler.handle(error, `Failed to load item definitions from ${filePath}`);
            // Game might still be playable but without item details or effects
        }
    }

    /**
     * @method getItemDefinition
     * @description Retrieves the definition for a specific item.
     * @param {string} itemId - The ID of the item.
     * @returns {object | null} The item definition object, or null if not found.
     */
    getItemDefinition(itemId) {
        return this.itemsData[itemId] || null;
    }

    /**
     * @method getPlayerItems
     * @description Returns a list of items currently in the player's inventory.
     *              Each item in the list includes its definition and quantity.
     * @returns {Array<object>} Array of { definition: object, quantity: number, ...otherPlayerItemProps }
     */
    getPlayerItems() {
        return this.playerInventory.items.map(playerItem => {
            const definition = this.getItemDefinition(playerItem.itemId);
            if (definition) {
                return { ...playerItem, definition }; // Combine player's item data with its definition
            }
            return { ...playerItem, definition: { id: playerItem.itemId, name: `Unknown Item (${playerItem.itemId})`, description: "" } }; // Fallback for unknown item
        }).filter(item => item.quantity > 0); // Filter out items with zero quantity if any
    }

    /**
     * @method getInventoryCapacity
     * @description Returns the maximum capacity of the player's inventory.
     * @returns {number}
     */
    getInventoryCapacity() {
        return this.playerInventory.capacity || (this.stateManager.getGameConstants().MAX_INVENTORY_SLOTS || 20);
    }

    /**
     * @method getCurrentInventorySize
     * @description Returns the number of unique item stacks in the inventory.
     * @returns {number}
     */
    getCurrentInventorySize() {
        return this.playerInventory.items.length;
    }


    /**
     * @method addItem
     * @description Adds an item to the player's inventory.
     * @param {string} itemId - The ID of the item to add.
     * @param {number} [quantity=1] - The quantity of the item to add.
     * @returns {boolean} True if the item was successfully added (or quantity increased), false otherwise (e.g., inventory full for new stack).
     */
    addItem(itemId, quantity = 1) {
        if (quantity <= 0) return false;

        const itemDef = this.getItemDefinition(itemId);
        if (!itemDef) {
            console.warn(`InventorySystem: Attempted to add unknown item "${itemId}".`);
            return false;
        }

        const existingItem = this.playerInventory.items.find(item => item.itemId === itemId);

        if (existingItem) {
            // Item already exists, increase quantity (if stackable)
            if (itemDef.stackable !== false) { // Default to stackable if not specified
                existingItem.quantity += quantity;
                console.log(`InventorySystem: Increased quantity of "${itemId}" by ${quantity}. New quantity: ${existingItem.quantity}.`);
            } else {
                // Not stackable, and it already exists. What to do?
                // Option 1: Don't add.
                // Option 2: Add as a new stack if inventory has space (treat as unique instance).
                // For simplicity, let's assume non-stackable means only one instance allowed.
                // Or, if multiple non-stackable are allowed, they'd need unique instance IDs.
                // For now, let's assume if stackable is false, we only allow one.
                // If we want multiple non-stackable, we'd need a different check or logic for adding.
                console.log(`InventorySystem: Item "${itemId}" is not stackable and already exists. Not adding.`);
                this.uiManager.showNotification(
                    InteractiveAdventure.localization.getString('item_not_stackable_exists', { itemName: itemDef.name }),
                    'info'
                );
                return false; // Or handle as a new unique item if inventory has space
            }
        } else {
            // New item, add to inventory if space available
            if (this.playerInventory.items.length < this.getInventoryCapacity()) {
                this.playerInventory.items.push({ itemId, quantity, ...itemDef.initialProps }); // Add initialProps from definition if any
                console.log(`InventorySystem: Added new item "${itemId}" (quantity: ${quantity}).`);
            } else {
                console.log(`InventorySystem: Inventory full. Cannot add new item "${itemId}".`);
                this.uiManager.showNotification(
                    InteractiveAdventure.localization.getString('inventory_full', { itemName: itemDef.name }),
                    'warning'
                );
                return false; // Inventory full for new item stacks
            }
        }

        this.uiManager.showNotification(
            InteractiveAdventure.localization.getString('item_added_to_inventory', { quantity, itemName: itemDef.name }),
            'success'
        );
        this.updateInventoryUI(); // Notify UIManager to refresh display
        InteractiveAdventure.achievementSystem.triggerEvent('item_acquired', { itemId, quantity });
        return true;
    }

    /**
     * @method removeItem
     * @description Removes an item or a certain quantity of an item from the player's inventory.
     * @param {string} itemId - The ID of the item to remove.
     * @param {number} [quantity=1] - The quantity to remove. If quantity is more than available, removes all.
     * @returns {boolean} True if the item (or part of it) was successfully removed, false otherwise.
     */
    removeItem(itemId, quantity = 1) {
        if (quantity <= 0) return false;

        const itemIndex = this.playerInventory.items.findIndex(item => item.itemId === itemId);

        if (itemIndex > -1) {
            const playerItem = this.playerInventory.items[itemIndex];
            const itemDef = this.getItemDefinition(itemId) || { name: itemId }; // Fallback name

            if (playerItem.quantity > quantity) {
                playerItem.quantity -= quantity;
                console.log(`InventorySystem: Removed ${quantity} of "${itemId}". Remaining: ${playerItem.quantity}.`);
            } else {
                quantity = playerItem.quantity; // Actual quantity removed
                this.playerInventory.items.splice(itemIndex, 1); // Remove item stack completely
                console.log(`InventorySystem: Removed all ${quantity} of "${itemId}".`);
            }

            this.uiManager.showNotification(
                InteractiveAdventure.localization.getString('item_removed_from_inventory', { quantity, itemName: itemDef.name }),
                'info'
            );
            this.updateInventoryUI();
            InteractiveAdventure.achievementSystem.triggerEvent('item_removed', { itemId, quantity });
            return true;
        } else {
            console.warn(`InventorySystem: Attempted to remove item "${itemId}" not found in inventory.`);
            return false;
        }
    }

    /**
     * @method hasItem
     * @description Checks if the player has a specific item.
     * @param {string} itemId - The ID of the item to check for.
     * @param {number} [minQuantity=1] - The minimum quantity required.
     * @returns {boolean} True if the player has the item (and enough quantity), false otherwise.
     */
    hasItem(itemId, minQuantity = 1) {
        const playerItem = this.playerInventory.items.find(item => item.itemId === itemId);
        return playerItem && playerItem.quantity >= minQuantity;
    }

    /**
     * @method getItemCount
     * @description Gets the quantity of a specific item in the inventory.
     * @param {string} itemId - The ID of the item.
     * @returns {number} The quantity of the item, or 0 if not found.
     */
    getItemCount(itemId) {
        const playerItem = this.playerInventory.items.find(item => item.itemId === itemId);
        return playerItem ? playerItem.quantity : 0;
    }

    /**
     * @method useItem
     * @description Handles the logic for using an item.
     *              This might involve triggering effects, consuming the item, etc.
     * @param {string} itemId - The ID of the item to use.
     * @param {object} [target=null] - Optional target for the item's use (e.g., another character, an object in scene).
     * @returns {Promise<boolean>} True if the item was used successfully, false otherwise.
     */
    async useItem(itemId, target = null) {
        if (!this.hasItem(itemId)) {
            console.warn(`InventorySystem: Attempted to use item "${itemId}" but player does not have it.`);
            this.uiManager.showNotification(InteractiveAdventure.localization.getString('item_not_in_inventory'), 'error');
            return false;
        }

        const itemDef = this.getItemDefinition(itemId);
        if (!itemDef) {
            console.error(`InventorySystem: Item definition for "${itemId}" not found. Cannot use.`);
            return false;
        }

        console.log(`InventorySystem: Player attempts to use item "${itemDef.name}".`);

        // 1. Check if item is usable
        if (itemDef.usable === false) { // Explicitly false, default is true or depends on effects
            this.uiManager.showNotification(
                InteractiveAdventure.localization.getString('item_not_usable', { itemName: itemDef.name }),
                'info'
            );
            return false;
        }

        // 2. Check conditions for use (if any)
        if (itemDef.useConditions && InteractiveAdventure.choiceEngine) {
            if (!InteractiveAdventure.choiceEngine.areConditionsMet(itemDef.useConditions)) {
                const failureMsg = itemDef.useConditionFailureMessageKey
                    ? InteractiveAdventure.localization.getString(itemDef.useConditionFailureMessageKey, { itemName: itemDef.name })
                    : InteractiveAdventure.localization.getString('item_use_condition_not_met', { itemName: itemDef.name });
                this.uiManager.showNotification(failureMsg, 'warning');
                return false;
            }
        }

        // 3. Apply effects
        let effectsApplied = false;
        if (itemDef.effects && itemDef.effects.onUse && InteractiveAdventure.choiceEngine) {
            const outcome = await InteractiveAdventure.choiceEngine.executeEffects(itemDef.effects.onUse, "onUseItem", { item: itemDef, target });
            effectsApplied = outcome.effectsAppliedCount > 0; // Assuming executeEffects returns this
            if (outcome.message) {
                this.uiManager.showNotification(outcome.message, outcome.messageType || 'info');
            }
        } else {
            // No specific onUse effects, but item might still be "used" if consumable
            // Or it's a passive item / quest item that doesn't "do" anything on manual use.
            // For now, assume if no onUse, it's not actively usable unless it's consumable.
            if (!itemDef.consumable) {
                 this.uiManager.showNotification(
                    InteractiveAdventure.localization.getString('item_has_no_effect', { itemName: itemDef.name }),
                    'info'
                );
                // return false; // If no effect and not consumable, was it "used"? Debatable.
            }
        }


        // 4. Consume item if applicable
        if (itemDef.consumable) {
            this.removeItem(itemId, 1); // Consumes one unit
            console.log(`InventorySystem: Item "${itemDef.name}" consumed.`);
            // Notification for consumption is handled by removeItem or the effect message
        }

        InteractiveAdventure.achievementSystem.triggerEvent('item_used', { itemId });
        this.updateInventoryUI(); // Refresh UI after use

        // If there were no explicit effects, but it was consumable, consider it "used".
        // If not consumable and no effects, it might not count as "successfully used".
        return effectsApplied || itemDef.consumable;
    }


    /**
     * @method equipItem
     * @description Equips an item. (For games with equipment slots)
     * @param {string} itemId - The ID of the item to equip.
     * @param {string} [slot] - The equipment slot (e.g., 'weapon', 'armor').
     * @returns {boolean} True if equipped, false otherwise.
     */
    equipItem(itemId, slot) {
        // This is a placeholder. Actual implementation depends on equipment system design.
        const playerItem = this.playerInventory.items.find(item => item.itemId === itemId);
        const itemDef = this.getItemDefinition(itemId);

        if (playerItem && itemDef && itemDef.equipable) {
            // 1. Check if item type matches slot type
            // 2. Unequip any item currently in that slot
            // 3. Mark playerItem as equipped: playerItem.equipped = true; playerItem.slot = slot;
            // 4. Apply equipment effects (e.g., stat changes)
            // 5. Update UI
            console.log(`InventorySystem: Item "${itemId}" equipped to slot "${slot}". (Not fully implemented)`);
            // playerItem.equipped = true; // Example
            // this.updateInventoryUI();
            // InteractiveAdventure.statsSystem.applyEquipmentEffects(itemDef);
            this.uiManager.showNotification(`${itemDef.name} equipped.`, 'info');
            return true;
        }
        this.uiManager.showNotification(`Cannot equip ${itemDef ? itemDef.name : itemId}.`, 'warning');
        return false;
    }

    /**
     * @method unequipItem
     * @description Unequips an item.
     * @param {string} itemId - The ID of the item to unequip.
     * @returns {boolean} True if unequipped, false otherwise.
     */
    unequipItem(itemId) {
        // Placeholder
        const playerItem = this.playerInventory.items.find(item => item.itemId === itemId && item.equipped);
        const itemDef = this.getItemDefinition(itemId);

        if (playerItem && itemDef) {
            // 1. Mark playerItem as not equipped: playerItem.equipped = false; delete playerItem.slot;
            // 2. Remove equipment effects
            // 3. Update UI
            console.log(`InventorySystem: Item "${itemId}" unequipped. (Not fully implemented)`);
            // playerItem.equipped = false; // Example
            // this.updateInventoryUI();
            // InteractiveAdventure.statsSystem.removeEquipmentEffects(itemDef);
            this.uiManager.showNotification(`${itemDef.name} unequipped.`, 'info');
            return true;
        }
        return false;
    }


    /**
     * @method updateInventoryUI
     * @description Signals the UIManager to refresh the inventory display.
     *              This is a convenience method. The actual DOM manipulation happens in UIManager.
     */
    updateInventoryUI() {
        if (this.uiManager && typeof this.uiManager.renderInventory === 'function') {
            this.uiManager.renderInventory(this.getPlayerItems(), this.getInventoryCapacity());
        } else if (this.uiManager && InteractiveAdventure.gameController && typeof InteractiveAdventure.gameController.refreshInventoryDisplay === 'function') {
            // If inventory is part of a larger controller's view
            InteractiveAdventure.gameController.refreshInventoryDisplay();
        }
    }

    /**
     * @method initializeFromState
     * @description Re-initializes the inventory system based on loaded game state.
     *              Called by StateManager after a game is loaded.
     * @param {object} gameState - The loaded game state.
     */
    initializeFromState(gameState) {
        if (gameState && gameState.inventory) {
            this.playerInventory = gameState.inventory;
            if (!this.playerInventory.items) this.playerInventory.items = [];
            if (this.playerInventory.capacity === undefined) {
                 this.playerInventory.capacity = this.stateManager.getGameConstants().MAX_INVENTORY_SLOTS || 20;
            }
            console.log("InventorySystem: Re-initialized from loaded game state.");
        } else {
            console.warn("InventorySystem: Could not re-initialize from state, inventory data missing in loaded state.");
            // Fallback to default if necessary
            this.playerInventory = this.stateManager.getGameState().inventory; // Get current (possibly default)
        }
        // Item definitions (this.itemsData) are typically loaded once and are static,
        // so they don't need to be re-initialized from save state unless they can change per-game.
        this.updateInventoryUI();
    }

    /**
     * @method updateGameStateBeforeSave
     * @description Ensures the inventory part of the main gameState object is up-to-date.
     *              Called by StateManager before saving.
     * @param {object} gameStateRef - Reference to the main game state object.
     */
    updateGameStateBeforeSave(gameStateRef) {
        // Since this.playerInventory is a direct reference, it should already be up-to-date.
        // However, if there were any complex calculations or temporary states within InventorySystem
        // that need to be committed to gameState.inventory, this is the place.
        // gameStateRef.inventory = this.playerInventory; // This is usually not needed if it's a reference
        console.log("InventorySystem: State prepared for saving.", this.playerInventory);
    }
}

export default InventorySystem;
