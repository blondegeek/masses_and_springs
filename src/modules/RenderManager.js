export class RenderManager {
    constructor(scene, physicsManager, springManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.springManager = springManager;
        this.timer = 0;
    }

    setupRenderLoop(sphereManager) {
        this.scene.registerBeforeRender(() => {
            // Apply friction to all bodies
            this.physicsManager.applyFriction(sphereManager.getBodies());
            
            // Update all spring cylinders
            this.springManager.updateAllCylinders();
            
            this.timer++;
        });
    }

    getTimer() {
        return this.timer;
    }

    resetTimer() {
        this.timer = 0;
    }
}