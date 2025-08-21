# Masses and Springs - Interactive Physics Simulation

An interactive browser-based physics simulation built with Babylon.js that allows you to create networks of masses (spheres) and springs, manipulate them in 3D space, and save/load configurations.

## Features

- **Interactive 3D Environment**: Create and manipulate masses and springs in a 3D scene
- **Physics Simulation**: Real-time physics with customizable spring properties
- **File I/O**: Save and load configurations as JSON files
- **Group Management**: Group springs together for easier manipulation
- **Merge Functionality**: Combine multiple spheres into one
- **Keyboard Shortcuts**: Quick access to all major functions

## Refactored Architecture

The codebase has been refactored from a monolithic structure into a modular, maintainable architecture:

### Core Modules (`src/modules/`)

- **ApplicationCore.js** - Main application coordinator
- **SceneManager.js** - 3D scene setup, camera, lighting, and ground
- **SphereManager.js** - Mass/sphere creation, deletion, and merging
- **SpringManager.js** - Spring creation, deletion, grouping, and physics
- **UIManager.js** - GUI controls, buttons, and sliders
- **InputHandler.js** - Mouse and keyboard input processing
- **FileManager.js** - JSON save/load functionality
- **PhysicsManager.js** - Physics integration and friction
- **RenderManager.js** - Render loop and visual updates

### Key Benefits of Refactoring

1. **Separation of Concerns** - Each module handles a specific aspect of functionality
2. **Maintainability** - Code is organized and easier to understand
3. **Testability** - Individual modules can be tested in isolation
4. **Extensibility** - New features can be added without affecting existing code
5. **Reusability** - Modules can be reused or replaced independently

## Usage

### Getting Started

1. Open `index.html` in a modern web browser
2. Use the UI buttons or keyboard shortcuts to interact with the simulation

### Controls

#### Mouse Controls
- **Click & Drag**: Move spheres
- **Alt + Click**: Select multiple spheres (green highlight)
- **Shift + Click**: Select springs and view groups (red/yellow highlight)
- **Ctrl + Click**: Clear sphere selection
- **Ctrl + Shift + Click**: Clear spring selection

#### Keyboard Shortcuts
- **s** - Add sphere at origin
- **w** - Add spring between two selected spheres
- **d** - Delete selected objects
- **g** - Group selected springs
- **m** - Merge selected spheres
- **f** - Load from file (requires ?json=filename.json in URL)
- **p** - Print current configuration to console
- **?** - Download current configuration as JSON

### File Format

Configurations are saved as JSON files with the following structure:

```json
{
  "nodes": {
    "0": {"x": 0, "y": 1, "z": 0},
    "1": {"x": 5, "y": 1, "z": 0}
  },
  "edges": {
    "(0,1)": {
      "length": 5,
      "stiffness": 10,
      "damping": 0.5
    }
  },
  "groups": {
    "0": ["(0,1)"]
  }
}
```

### Loading Files

Add `?json=geometries/filename.json` to the URL to automatically load a configuration:
```
index.html?json=geometries/tetra_4.json
```

**Note**: For local file loading to work, your browser must allow access to local files. You may need to:
- Start a local web server (recommended): `python -m http.server 8000` or `npx serve`
- Or use browser flags like `--allow-file-access-from-files` (Chrome)

Example geometries included:
- `tetra_4.json` - Tetrahedron with 4 nodes
- `octa_6.json` - Octahedron with 6 nodes  
- `cube_test.json` - Simple cube structure
- `tetra_chain.json` - Chain of connected tetrahedra

## Dependencies

- **Babylon.js** - 3D engine and rendering
- **Cannon.js** - Physics simulation
- **D3.js v4** - File loading utilities
- **dat.GUI** - Debug interface
- **jQuery** - DOM manipulation
- **Math.js** - Mathematical operations

## Development

The modular structure makes it easy to extend functionality:

1. **Add new features** by creating new modules or extending existing ones
2. **Modify physics** in the PhysicsManager
3. **Add UI elements** through the UIManager
4. **Change rendering** in the RenderManager
5. **Add new file formats** in the FileManager

## Repository Structure

```
masses_and_springs/
├── index.html              # Main application
├── src/modules/             # Modular JavaScript components
├── libs/                    # JavaScript dependencies
├── geometries/              # Saved shape configurations (.json)
├── README.md               # This documentation
└── babylon.custom.js       # Custom Babylon.js build
```

## Features

The application maintains all functionality from the original while providing a cleaner, more maintainable codebase. All features including sphere creation, spring physics, grouping, merging, and file I/O are preserved and enhanced.

## Browser Compatibility

Requires a modern browser with ES6 module support. Tested on:
- Chrome 60+
- Firefox 60+
- Safari 10.1+
- Edge 16+