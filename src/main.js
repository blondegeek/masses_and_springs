import { ApplicationCore } from './modules/ApplicationCore.js';

// Disable right-click context menu on canvas
$("body").on("contextmenu", "#renderCanvas", function (e) {
    return false;
});

// Initialize the application
async function initializeApplication() {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true, { stencil: true });
    
    const app = new ApplicationCore(canvas, engine);
    
    try {
        const scene = await app.initialize();
        
        // Start the render loop
        engine.runRenderLoop(function () {
            scene.render();
        });
        
        // Handle browser resize
        window.addEventListener("resize", function () {
            engine.resize();
        });
        
        console.log("Masses and Springs application initialized successfully");
        
        // Make app globally available for debugging
        window.massesAndSpringsApp = app;
        
    } catch (error) {
        console.error("Failed to initialize application:", error);
    }
}

// Start the application when the page loads
document.addEventListener("DOMContentLoaded", initializeApplication);