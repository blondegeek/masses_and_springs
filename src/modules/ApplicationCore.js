import { SceneManager } from './SceneManager.js';
import { SphereManager } from './SphereManager.js';
import { SpringManager } from './SpringManager.js';
import { UIManager } from './UIManager.js';
import { InputHandler } from './InputHandler.js';
import { FileManager } from './FileManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { RenderManager } from './RenderManager.js';

export class ApplicationCore {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        
        // Initialize managers
        this.sceneManager = new SceneManager(canvas, engine);
        this.physicsManager = new PhysicsManager();
        this.fileManager = new FileManager();
        
        // These will be initialized after scene creation
        this.sphereManager = null;
        this.springManager = null;
        this.uiManager = null;
        this.inputHandler = null;
        this.renderManager = null;
        
        this.scene = null;
    }

    async initialize() {
        // Create scene first
        this.scene = this.sceneManager.createScene();
        
        // Initialize other managers that depend on scene
        this.sphereManager = new SphereManager(this.scene, this.physicsManager);
        this.springManager = new SpringManager(this.scene);
        this.uiManager = new UIManager(this.scene);
        this.renderManager = new RenderManager(this.scene, this.physicsManager, this.springManager);
        
        // Initialize input handling
        this.inputHandler = new InputHandler(
            this.canvas, 
            this.scene, 
            this.sceneManager.camera, 
            this.sceneManager
        );
        
        // Setup UI
        this.uiManager.initialize();
        this.setupUI();
        
        // Setup input callbacks
        this.setupInputCallbacks();
        
        // Setup keyboard controls
        this.setupKeyboardControls();
        
        // Setup render loop
        this.renderManager.setupRenderLoop(this.sphereManager);
        
        // Check for file parameter and load if exists
        const jsonFile = this.fileManager.getParameterByName("json");
        if (jsonFile) {
            await this.loadFromFile(jsonFile);
        }
        
        return this.scene;
    }

    setupUI() {
        this.uiManager.addButton("Add Sphere (s)", () => this.addSphere());
        this.uiManager.addButton("Add Spring (w)", () => this.addSpring());
        this.uiManager.addButton("Delete (d)", () => this.deleteSelected());
        this.uiManager.addButton("Group Springs (g)", () => this.groupSprings());
        this.uiManager.addButton("Break Selected\nSprings (b)", () => this.breakSelectedSprings());
        this.uiManager.addButton("Break All Springs\nin Group (n)", () => this.breakAllSprings());
        this.uiManager.addButton("Merge Spheres (m)", () => this.mergeSpheres());
        this.uiManager.addButton("Connect All\nSelected (c)", () => this.connectAllSelected());
        this.uiManager.addButton("Save File (?)", () => this.saveToFile());
        this.uiManager.addButton("Load File (f)", () => this.loadFromFilePrompt());
        this.uiManager.addButton("Print to Console (p)", () => this.printToConsole());
    }

    setupInputCallbacks() {
        this.inputHandler.onSphereSelected = (mesh, selected) => {
            if (selected) {
                this.sceneManager.highlightLayer.addMesh(mesh, BABYLON.Color3.Green());
            } else {
                this.sceneManager.highlightLayer.removeMesh(mesh);
            }
        };

        this.inputHandler.onSpringSelected = (mesh, group, selected = true) => {
            if (selected) {
                this.sceneManager.highlightLayer.addMesh(mesh, BABYLON.Color3.Red());
                
                // If group is provided (shift+click), highlight group members in yellow and show controls
                if (group) {
                    group.forEach(joint => {
                        if (this.inputHandler.getPickedSprings().indexOf(joint.cylinder) === -1) {
                            this.sceneManager.highlightLayer.addMesh(joint.cylinder, BABYLON.Color3.Yellow());
                            this.inputHandler.groupOfPickedSpringsInfo.push(joint.cylinder);
                        }
                    });
                    
                    this.uiManager.showSpringControl(group);
                } else {
                    // For Ctrl+Alt+click (individual spring), create a temporary group and show slider
                    const tempGroup = new Set();
                    tempGroup.add(mesh.joint);
                    mesh.joint.tempGroup = tempGroup;
                    this.uiManager.showSpringControl(tempGroup);
                }
            } else {
                this.sceneManager.highlightLayer.removeMesh(mesh);
                if (group) {
                    this.uiManager.hideSpringControl(group);
                } else if (mesh.joint && mesh.joint.tempGroup) {
                    // Clean up temporary group for individual spring
                    this.uiManager.hideSpringControl(mesh.joint.tempGroup);
                    delete mesh.joint.tempGroup;
                }
            }
        };
    }

    setupKeyboardControls() {
        const keyHandlers = {
            's': () => this.addSphere(),
            'w': () => this.addSpring(),
            'd': () => this.deleteSelected(),
            'g': () => this.groupSprings(),
            'f': () => this.loadFromFilePrompt(),
            'm': () => this.mergeSpheres(),
            'c': () => this.connectAllSelected(),
            'p': () => this.printToConsole(),
            '?': () => this.saveToFile()
        };
        
        this.inputHandler.setupKeyboardControls(keyHandlers);
    }

    addSphere(name = "sphere", x = 0, y = 1, z = 0) {
        return this.sphereManager.addSphere(name, x, y, z);
    }

    addSpring(mesh1 = null, mesh2 = null) {
        const pickedMeshes = this.inputHandler.getPickedMeshes();
        
        if (!mesh1 && !mesh2 && pickedMeshes.length === 2) {
            mesh1 = pickedMeshes[0];
            mesh2 = pickedMeshes[1];
        }
        
        if (mesh1 && mesh2) {
            return this.springManager.addSpring(mesh1, mesh2);
        }
        
        console.log("Need two spheres selected to add spring");
        return null;
    }

    deleteSelected() {
        const pickedMeshes = this.inputHandler.getPickedMeshes();
        const pickedSprings = this.inputHandler.getPickedSprings();
        
        const thingsToDelete = new Set();
        const groupsToCheck = new Set();

        // Handle sphere deletions
        pickedMeshes.forEach(mesh => {
            if (mesh.sphere) {
                thingsToDelete.add(mesh);
                if (mesh.joints) {
                    mesh.joints.forEach(joint => {
                        if (!thingsToDelete.has(joint)) {
                            groupsToCheck.add(joint.group);
                            joint.group.delete(joint);
                            thingsToDelete.add(joint);
                        }
                    });
                }
            }
        });

        // Handle spring deletions
        pickedSprings.forEach(mesh => {
            if (mesh.cylinder) {
                if (!thingsToDelete.has(mesh.joint)) {
                    groupsToCheck.add(mesh.joint.group);
                    mesh.joint.group.delete(mesh.joint);
                    thingsToDelete.add(mesh.joint);
                }
            }
        });

        // Delete everything
        thingsToDelete.forEach(element => {
            if (element.sphere) {
                this.sphereManager.deleteSphere(element);
            } else {
                this.springManager.deleteJoint(element);
            }
        });

        // Check if any groups need cleanup
        groupsToCheck.forEach(group => {
            this.springManager.checkGroup(group);
        });

        // Clear selections
        this.inputHandler.clearMeshSelection();
        this.inputHandler.clearSpringSelection();
    }

    groupSprings() {
        const pickedSprings = this.inputHandler.getPickedSprings();
        if (pickedSprings.length >= 2) {
            // Collect ALL joints that will be involved in the grouping operation
            const allJointsToGroup = new Set();
            const groupsToCleanup = new Set();
            
            pickedSprings.forEach(mesh => {
                // Add the joint itself
                allJointsToGroup.add(mesh.joint);
                
                // Track existing groups that will be merged (for slider cleanup)
                if (mesh.joint.group && mesh.joint.group.size > 1) {
                    groupsToCleanup.add(mesh.joint.group);
                }
                
                // Add all joints from this joint's existing group
                if (mesh.joint.group) {
                    mesh.joint.group.forEach(joint => {
                        allJointsToGroup.add(joint);
                    });
                }
            });
            
            // Clean up old group sliders before creating new group
            groupsToCleanup.forEach(group => {
                this.uiManager.hideSpringControl(group);
            });
            
            // Clean up individual sliders for ALL joints being grouped
            allJointsToGroup.forEach(joint => {
                if (joint.tempGroup) {
                    this.uiManager.hideSpringControl(joint.tempGroup);
                    delete joint.tempGroup;
                }
            });
            
            // Convert joints back to cylinders for SpringManager
            const allCylindersToGroup = Array.from(allJointsToGroup).map(joint => joint.cylinder);
            
            const newGroup = this.springManager.groupSprings(allCylindersToGroup);
            if (newGroup) {
                this.uiManager.showSpringControl(newGroup);
            }
        }
    }

    breakSelectedSprings() {
        // Implementation for breaking selected springs
        console.log("Break selected springs functionality to be implemented");
    }

    breakAllSprings() {
        // Implementation for breaking all springs in group
        console.log("Break all springs functionality to be implemented");
    }

    mergeSpheres() {
        const pickedMeshes = this.inputHandler.getPickedMeshes();
        const spheresToMerge = pickedMeshes.filter(m => m.sphere);
        
        if (spheresToMerge.length >= 2) {
            this.sphereManager.mergeSpheres(
                spheresToMerge,
                (mesh1, mesh2, length, stiffness, damping) => {
                    return this.springManager.addSpring(mesh1, mesh2, length, stiffness, damping);
                },
                (joint) => {
                    joint.group.delete(joint);
                    this.springManager.checkGroup(joint.group);
                    this.springManager.deleteJoint(joint);
                }
            );
            
            this.inputHandler.clearMeshSelection();
        }
    }

    connectAllSelected() {
        const pickedMeshes = this.inputHandler.getPickedMeshes();
        const spheresToConnect = pickedMeshes.filter(m => m.sphere);
        
        if (spheresToConnect.length < 2) {
            console.log("Need at least 2 spheres selected to connect all");
            return;
        }

        const addedSprings = this.springManager.connectAllSpheres(spheresToConnect);
        
        if (addedSprings.length > 0) {
            console.log(`Connected ${spheresToConnect.length} spheres with ${addedSprings.length} new springs`);
        } else {
            console.log("All selected spheres were already connected");
        }
    }

    async loadFromFile(filename) {
        try {
            await this.fileManager.loadFromFile(
                filename, 
                this.sphereManager, 
                this.springManager, 
                this.uiManager
            );
            console.log("File loaded successfully");
        } catch (error) {
            console.error("Error loading file:", error);
        }
    }

    loadFromFilePrompt() {
        const filename = this.fileManager.getParameterByName("json");
        if (filename) {
            this.loadFromFile(filename);
        } else {
            console.log("No file specified in URL parameters");
        }
    }

    saveToFile() {
        const data = this.fileManager.createSaveData(this.sphereManager, this.springManager);
        this.fileManager.saveToFile(data);
    }

    printToConsole() {
        const data = this.fileManager.createSaveData(this.sphereManager, this.springManager);
        this.fileManager.printToConsole(data);
    }

    dispose() {
        this.uiManager.dispose();
        this.sceneManager.dispose();
    }
}