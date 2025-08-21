export class SpringManager {
    constructor(scene) {
        this.scene = scene;
        this.springGroups = [];
        this.defaultRestLength = 5;
        this.cylinderMaterial = this.createCylinderMaterial();
    }

    createCylinderMaterial() {
        const cylinderMat = new BABYLON.StandardMaterial("cylinder_mat", this.scene);
        cylinderMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        return cylinderMat;
    }

    addSpring(mesh1, mesh2, length = this.defaultRestLength, stiffness = 10.0, damping = 0.5) {
        const newGroup = new Set();

        const joint = new BABYLON.PhysicsJoint(
            BABYLON.PhysicsJoint.SpringJoint,
            {
                length: length,
                stiffness: stiffness,
                damping: damping
            }
        );

        this.springGroups.push(newGroup);
        newGroup.add(joint);
        joint.group = newGroup;

        joint.start_mesh = mesh1;
        joint.end_mesh = mesh2;

        mesh1.joints.push(joint);
        mesh2.joints.push(joint);

        mesh1.physicsImpostor.addJoint(mesh2.physicsImpostor, joint);
        
        this.createCylinderForSpring(joint);
        
        return joint;
    }

    springExists(mesh1, mesh2) {
        return mesh1.joints.some(joint => 
            (joint.start_mesh === mesh1 && joint.end_mesh === mesh2) ||
            (joint.start_mesh === mesh2 && joint.end_mesh === mesh1)
        );
    }

    connectAllSpheres(spheres, length = this.defaultRestLength, stiffness = 10.0, damping = 0.5) {
        const addedSprings = [];
        
        for (let i = 0; i < spheres.length; i++) {
            for (let j = i + 1; j < spheres.length; j++) {
                const sphere1 = spheres[i];
                const sphere2 = spheres[j];
                
                if (!this.springExists(sphere1, sphere2)) {
                    const spring = this.addSpring(sphere1, sphere2, length, stiffness, damping);
                    addedSprings.push(spring);
                }
            }
        }
        
        console.log(`Added ${addedSprings.length} new springs between ${spheres.length} spheres`);
        return addedSprings;
    }

    deleteJoint(joint) {
        const startMesh = joint.start_mesh;
        const endMesh = joint.end_mesh;

        joint.cylinder.dispose();

        const startMeshJointsLength = startMesh.joints.length;
        let jointCounter = 0;
        for (let i = 0; i < startMeshJointsLength; i++) {
            if (startMesh.joints[i] === joint) {
                break;
            } else {
                if (startMesh.joints[i].start_mesh === startMesh) {
                    jointCounter++;
                }
            }
        }

        try {
            startMesh.physicsImpostor._onAfterPhysicsStepCallbacks.splice(jointCounter, 1);
        } catch (e) {
            console.log("physics step callback splice exception");
        }

        const elementIndexStart = startMesh.joints.indexOf(joint);
        if (elementIndexStart > -1) {
            startMesh.joints.splice(elementIndexStart, 1);
        }

        const elementIndexEnd = endMesh.joints.indexOf(joint);
        if (elementIndexEnd > -1) {
            endMesh.joints.splice(elementIndexEnd, 1);
        }
    }

    groupSprings(cylinders) {
        if (!cylinders || cylinders.length < 2) {
            return;
        }

        const newGroup = new Set();
        this.springGroups.push(newGroup);
        const groupsToMerge = new Set();
        
        cylinders.forEach(cylinder => {
            groupsToMerge.add(cylinder.joint.group);
        });

        if (groupsToMerge.size === 1) {
            return;
        }

        groupsToMerge.forEach(group => {
            group.forEach(joint => {
                newGroup.add(joint);
            });
            
            const groupIndex = this.springGroups.indexOf(group);
            if (groupIndex > -1) {
                this.springGroups.splice(groupIndex, 1);
            }
        });

        newGroup.forEach(joint => {
            joint.group = newGroup;
        });

        return newGroup;
    }

    createCylinderForSpring(joint) {
        const path = [joint.start_mesh.position, joint.end_mesh.position];
        const cylDiameter = 0.5;

        const cylinder = new BABYLON.MeshBuilder.CreateTube(
            "cylinder",
            { path: path, radius: cylDiameter / 2.0, updatable: true },
            this.scene
        );
        
        cylinder.material = this.cylinderMaterial;
        cylinder.start_mesh = joint.start_mesh;
        cylinder.end_mesh = joint.end_mesh;
        cylinder.joint = joint;
        cylinder.cylinder = true;
        joint.cylinder = cylinder;

        return cylinder;
    }

    updateCylinder(cylinder) {
        return BABYLON.MeshBuilder.CreateTube(
            "cylinder",
            {
                path: [cylinder.start_mesh.position, cylinder.end_mesh.position],
                radius: cylinder.radius,
                instance: cylinder
            },
            this.scene
        );
    }

    updateAllCylinders() {
        this.springGroups.forEach(group => {
            group.forEach(joint => {
                this.updateCylinder(joint.cylinder);
            });
        });
    }

    getSpringGroups() {
        return this.springGroups;
    }

    checkGroup(group) {
        let stillThere = 0;
        group.forEach(joint => {
            if (this.springGroups.some(g => g.has(joint))) {
                stillThere++;
            }
        });
        
        if (stillThere === 0) {
            console.log("group being removed");
            const groupIndex = this.springGroups.indexOf(group);
            if (groupIndex > -1) {
                this.springGroups.splice(groupIndex, 1);
            }
        }
    }
}