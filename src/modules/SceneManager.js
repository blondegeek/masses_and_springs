export class SceneManager {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.scene = null;
        this.camera = null;
        this.lights = [];
        this.ground = null;
        this.highlightLayer = null;
    }

    createScene() {
        this.scene = new BABYLON.Scene(this.engine);

        this.camera = new BABYLON.ArcRotateCamera(
            "Camera",
            Math.PI / 2,
            Math.PI / 2,
            20,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true, true);

        this.highlightLayer = new BABYLON.HighlightLayer("hl1", this.scene);

        this.lights.push(new BABYLON.HemisphericLight(
            "light1",
            new BABYLON.Vector3(1, 1, 0),
            this.scene
        ));
        this.lights.push(new BABYLON.PointLight(
            "light2",
            new BABYLON.Vector3(0, 1, -1),
            this.scene
        ));

        this.createGround();
        
        this.scene.enablePhysics(new BABYLON.Vector3(0, 0, 0));

        return this.scene;
    }

    createGround() {
        this.ground = BABYLON.MeshBuilder.CreatePlane(
            "ground",
            { width: 1000, size: 1000, tileSize: 1 },
            this.scene
        );
        this.ground.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        this.ground.isPickable = false;

        const myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);
        myMaterial.alpha = 0.0;
        this.ground.material = myMaterial;
    }

    getGroundPosition(evt) {
        const pickinfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh === this.ground
        );
        return pickinfo.hit ? pickinfo.pickedPoint : null;
    }

    dispose() {
        this.scene.dispose();
    }
}