export class FileManager {
    constructor() {
        this.d3 = window.d3;
    }

    getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    async loadFromFile(filename, sphereManager, springManager, uiManager) {
        return new Promise((resolve, reject) => {
            this.d3.json(filename, (error, data) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const nodes = data["nodes"];
                    const edges = data["edges"];
                    const nodeKeys = Object.keys(nodes);
                    const edgeKeys = Object.keys(edges);

                    // Create Spheres
                    for (const key in nodes) {
                        nodes[key].sphere = sphereManager.addSphere(
                            key,
                            parseFloat(nodes[key].x),
                            parseFloat(nodes[key].y),
                            parseFloat(nodes[key].z)
                        );
                    }

                    // Create Springs
                    for (const key of edgeKeys) {
                        const keyArray = JSON.parse(
                            key.replace(")", "]").replace("(", "[")
                        );
                        const mesh1 = nodes[keyArray[0]].sphere;
                        const mesh2 = nodes[keyArray[1]].sphere;
                        const edgeKey = key;
                        const length = edges[edgeKey].length;
                        const stiffness = edges[edgeKey].stiffness;
                        const damping = edges[edgeKey].damping;
                        
                        edges[edgeKey].joint = springManager.addSpring(
                            mesh1,
                            mesh2,
                            length,
                            stiffness,
                            damping
                        );
                    }

                    // Group springs if file has groups
                    if (data.hasOwnProperty("groups")) {
                        const groups = data["groups"];
                        for (const group in groups) {
                            const cylinders = [];
                            const groupEdges = groups[group];
                            groupEdges.forEach(groupEdge => {
                                cylinders.push(edges[groupEdge].joint.cylinder);
                            });
                            springManager.groupSprings(cylinders);
                        }
                    }

                    resolve({ nodes, edges });
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    createSaveData(sphereManager, springManager) {
        const outputFile = {
            nodes: {},
            edges: {},
            groups: {}
        };

        const bodies = sphereManager.getBodies();
        for (let i = 0; i < bodies.length; i++) {
            const center = bodies[i].getObjectCenter();
            outputFile.nodes[i] = {
                x: center.x,
                y: center.y,
                z: center.z
            };
        }

        const springGroups = springManager.getSpringGroups();
        for (let i = 0; i < springGroups.length; i++) {
            const group = springGroups[i];
            outputFile.groups[i] = [];
            
            group.forEach(joint => {
                const startIndex = bodies.indexOf(joint.start_mesh.physicsImpostor);
                const endIndex = bodies.indexOf(joint.end_mesh.physicsImpostor);
                const key = "(" + startIndex.toString() + "," + endIndex.toString() + ")";
                
                outputFile.edges[key] = {
                    length: joint.physicsJoint.restLength,
                    stiffness: joint.physicsJoint.stiffness,
                    damping: joint.physicsJoint.damping
                };
                outputFile.groups[i].push(key);
            });
        }

        return outputFile;
    }

    saveToFile(data, filename = "scene.json") {
        const dataStr = "data:text/json;charset=utf-8," + 
                        encodeURIComponent(JSON.stringify(data, null, "\t"));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", filename);
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        dlAnchorElem.remove();
    }

    printToConsole(data) {
        console.log(data);
    }
}