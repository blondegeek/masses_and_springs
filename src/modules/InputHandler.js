export class InputHandler {
    constructor(canvas, scene, camera, sceneManager) {
        this.canvas = canvas;
        this.scene = scene;
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.startingPoint = null;
        this.currentMesh = null;
        this.pickedMeshesInfo = [];
        this.pickedSpringsInfo = [];
        this.groupOfPickedSpringsInfo = [];
        
        this.onSphereSelected = null;
        this.onSpringSelected = null;
        this.onMeshMoved = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener("pointerdown", this.onPointerDown.bind(this), false);
        this.canvas.addEventListener("pointerup", this.onPointerUp.bind(this), false);
        this.canvas.addEventListener("pointermove", this.onPointerMove.bind(this), false);
        
        this.scene.onDispose = () => {
            this.canvas.removeEventListener("pointerdown", this.onPointerDown.bind(this));
            this.canvas.removeEventListener("pointerup", this.onPointerUp.bind(this));
            this.canvas.removeEventListener("pointermove", this.onPointerMove.bind(this));
        };
    }

    onPointerDown(evt) {
        if (evt.button !== 0) return;

        if (event.ctrlKey && event.shiftKey) {
            this.clearSpringSelection();
        } else if (event.ctrlKey && event.altKey) {
            this.handleCtrlAltClick();
        } else if (event.ctrlKey) {
            this.clearMeshSelection();
        } else if (event.altKey) {
            this.handleAltClick();
        } else if (event.shiftKey) {
            this.handleShiftClick();
        } else {
            this.handleNormalClick(evt);
        }
    }

    onPointerUp() {
        if (this.startingPoint) {
            this.camera.attachControl(this.canvas);
            this.startingPoint = null;
        }
    }

    onPointerMove(evt) {
        if (!this.startingPoint) return;

        const current = this.sceneManager.getGroundPosition(evt);
        if (!current) return;

        const diff = current.subtract(this.startingPoint);

        if (this.pickedMeshesInfo.length > 0) {
            for (let i = 0; i < this.pickedMeshesInfo.length; i++) {
                this.pickedMeshesInfo[i].position.addInPlace(diff);
            }
            this.startingPoint = current;
        } else if (this.currentMesh) {
            this.currentMesh.position.addInPlace(diff);
            this.startingPoint = current;
        }

        if (this.onMeshMoved) {
            this.onMeshMoved();
        }
    }

    handleAltClick() {
        const pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (pickInfo.hit && pickInfo.pickedMesh.sphere) {
            this.pickedMeshesInfo.push(pickInfo.pickedMesh);
            if (this.onSphereSelected) {
                this.onSphereSelected(pickInfo.pickedMesh, true);
            }
        }
        
        this.startingPoint = this.sceneManager.getGroundPosition();
        if (this.startingPoint) {
            setTimeout(() => {
                this.camera.detachControl(this.canvas);
            }, 0);
        }
    }

    handleCtrlAltClick() {
        const pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (pickInfo.hit && pickInfo.pickedMesh.cylinder) {
            const joint = pickInfo.pickedMesh.joint;
            const group = joint.group;
            
            // Check if this spring belongs to a group with multiple springs
            if (group && group.size > 1) {
                // Select the entire group, not just individual spring
                this.selectSpringGroup(pickInfo.pickedMesh, group);
            } else {
                // Single spring or ungrouped - select individually
                if (this.pickedSpringsInfo.indexOf(pickInfo.pickedMesh) === -1) {
                    this.pickedSpringsInfo.push(pickInfo.pickedMesh);
                    if (this.onSpringSelected) {
                        this.onSpringSelected(pickInfo.pickedMesh, null, true);
                    }
                }
            }
        }
        // Note: Don't clear spring selection when clicking on non-springs
        // Users should use Ctrl+Shift+click to explicitly clear spring selection
    }

    handleShiftClick() {
        const pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (pickInfo.hit && pickInfo.pickedMesh.cylinder) {
            this.pickedSpringsInfo.push(pickInfo.pickedMesh);
            
            const cylinderIndex = this.groupOfPickedSpringsInfo.indexOf(pickInfo.pickedMesh);
            if (cylinderIndex > -1) {
                this.groupOfPickedSpringsInfo.splice(cylinderIndex, 1);
            }

            if (this.onSpringSelected) {
                this.onSpringSelected(pickInfo.pickedMesh, pickInfo.pickedMesh.joint.group);
            }
        }
    }

    selectSpringGroup(clickedMesh, group) {
        // Add the clicked spring to individual selection
        if (this.pickedSpringsInfo.indexOf(clickedMesh) === -1) {
            this.pickedSpringsInfo.push(clickedMesh);
        }
        
        // Add all other group members to group selection and highlight them
        group.forEach(joint => {
            if (joint.cylinder !== clickedMesh && this.groupOfPickedSpringsInfo.indexOf(joint.cylinder) === -1) {
                this.groupOfPickedSpringsInfo.push(joint.cylinder);
            }
        });
        
        // Notify about the group selection
        if (this.onSpringSelected) {
            this.onSpringSelected(clickedMesh, group, true);
        }
    }

    handleNormalClick(evt) {
        const pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            mesh => mesh !== this.sceneManager.ground
        );
        
        if (pickInfo.hit) {
            this.currentMesh = pickInfo.pickedMesh;
            if (this.currentMesh.sphere) {
                this.startingPoint = this.sceneManager.getGroundPosition(evt);
            }
            
            if (this.startingPoint) {
                setTimeout(() => {
                    this.camera.detachControl(this.canvas);
                }, 0);
            }
        }
    }

    clearMeshSelection() {
        if (this.onSphereSelected) {
            this.pickedMeshesInfo.forEach(mesh => {
                this.onSphereSelected(mesh, false);
            });
        }
        this.pickedMeshesInfo.length = 0;
    }

    clearSpringSelection() {
        if (this.onSpringSelected) {
            this.pickedSpringsInfo.forEach(mesh => {
                // Pass the group if this spring belongs to one (for proper cleanup)
                const group = mesh.joint && mesh.joint.group && mesh.joint.group.size > 1 ? mesh.joint.group : null;
                this.onSpringSelected(mesh, group, false);
            });
            this.groupOfPickedSpringsInfo.forEach(mesh => {
                // These are always part of groups
                const group = mesh.joint && mesh.joint.group ? mesh.joint.group : null;
                this.onSpringSelected(mesh, group, false);
            });
        }
        this.pickedSpringsInfo.length = 0;
        this.groupOfPickedSpringsInfo.length = 0;
    }

    getPickedMeshes() {
        return this.pickedMeshesInfo;
    }

    getPickedSprings() {
        return this.pickedSpringsInfo;
    }

    setupKeyboardControls(keyHandlers) {
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyUpTrigger,
                (evt) => {
                    const key = evt.sourceEvent.key;
                    if (keyHandlers[key]) {
                        keyHandlers[key]();
                    }
                }
            )
        );
    }
}