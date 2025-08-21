export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.advancedTexture = null;
        this.buttonPanel = null;
        this.controlPanel = null;
        this.defaultRestLength = 5;
    }

    initialize() {
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.createButtonPanel();
        this.createControlPanel();
    }

    createButtonPanel() {
        this.buttonPanel = new BABYLON.GUI.StackPanel();
        this.buttonPanel.width = "250px";
        this.buttonPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.buttonPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.advancedTexture.addControl(this.buttonPanel);
    }

    createControlPanel() {
        this.controlPanel = new BABYLON.GUI.StackPanel();
        this.controlPanel.width = "220px";
        this.controlPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.controlPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.advancedTexture.addControl(this.controlPanel);
    }

    addButton(text, callback) {
        const button = new BABYLON.GUI.Button.CreateSimpleButton("button", text);
        
        // Calculate height based on text content
        if (text.includes("Print to Console") || text.includes("Merge Spheres")) {
            button.height = "50px";
        } else if (text.includes("\n")) {
            button.height = "60px";
        } else {
            button.height = "30px";
        }
        
        button.width = "150px";
        button.color = "white";
        button.onPointerDownObservable.add(callback);
        this.buttonPanel.addControl(button);
        return button;
    }

    createSpringControl(group) {
        const header = this.createHeader();
        const slider = this.createSlider(header, group);
        return { header: header, slider: slider };
    }

    createHeader() {
        const header = new BABYLON.GUI.TextBlock();
        header.text = "Spring length: " + this.defaultRestLength.toFixed(2);
        header.height = "30px";
        header.color = "white";
        header.isVisible = false;
        return header;
    }

    createSlider(header, group) {
        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 1;
        slider.maximum = 10;
        slider.value = this.defaultRestLength;
        slider.height = "20px";
        slider.width = "200px";
        slider.joints = group;
        
        slider.onValueChangedObservable.add(value => {
            header.text = "Spring length: " + value.toFixed(2);
            if (slider.joints.size > 0) {
                slider.joints.forEach(joint => {
                    joint.physicsJoint.restLength = value;
                });
            }
        });
        
        slider.isVisible = false;
        return slider;
    }

    showSpringControl(group) {
        const control = this.createSpringControl(group);
        group.slider = control.slider;
        group.header = control.header;
        
        control.header.isVisible = true;
        control.slider.isVisible = true;
        this.controlPanel.addControl(control.header);
        this.controlPanel.addControl(control.slider);
        
        return control;
    }

    hideSpringControl(group) {
        if (group.header && group.slider) {
            this.controlPanel.removeControl(group.header);
            this.controlPanel.removeControl(group.slider);
            group.header.isVisible = false;
            group.slider.isVisible = false;
            
            try {
                group.slider.dispose();
                group.header.dispose();
            } catch (e) {}
        }
    }

    dispose() {
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
        }
    }
}