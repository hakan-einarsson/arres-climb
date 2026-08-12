# Copilot Instructions for 3D Game

A 3D isometric game for js13kgames competition using WebGL2 and custom software rendering.

## Build & Run Commands

- **Development server**: `npm run dev` - Starts Vite dev server on http://localhost:5173
- **Build for production**: `npm run build` - Creates optimized bundle in `dist/`
- **Preview production build**: `npm run preview` - Test the optimized build locally

No dedicated linting, testing, or formatting tools are configured. Focus on code quality during development.

## Architecture

The game uses a **game loop pattern** with three phases per frame:

```
requestAnimationFrame → update(dt) → render(renderer) → renderer.draw()
```

### Core Systems

1. **Game Loop** (`main.js`)
   - Sets up 16:9 canvas (height-based sizing)
   - Initializes Renderer, World, and input handling
   - Runs update → render → draw cycle at 60 FPS (dt in seconds)

2. **Renderer** (`Renderer.js`)
   - WebGL2-based with custom shader-based rendering
   - Vertex shader: transforms world-view positions with perspective projection
   - Fragment shader: applies texture atlas sampling
   - Maintains position buffer, depth sorting, and texture atlas binding
   - Loads textures from `assets/textures.png` (128×32px with 8×8px tiles)

3. **World & Terrain** (`world.js`, `tile.js`)
   - Generates 32×32 grid of tiles at startup
   - Tile types: `GRASS`, `ROCK`, `HOLE` (hole = invisible)
   - Each tile renders as a 3D block with textured faces (top/bottom faces use different textures)
   - Texture coordinates calculated via `getUV()` using column/row in sprite atlas
   - Uses `projectTriangle()` for isometric projection with depth-based sorting

4. **Game Objects** (`gameObjects.js`)
   - Simple registry pattern: array of objects
   - Objects can implement: `init()`, `update(dt)`, `render(renderer)`
   - Used for tiles (terrain), camera updates, and any future entities
   - Add: `addGameObject(obj)` | Remove: `removeGameObject(obj)`

5. **Camera & Input** (`camera.js`, `input.js`)
   - Camera: position (x, y, z) + rotation (yaw, pitch)
   - Input: WASD for movement, mouse look via pointer lock (click canvas to lock)
   - Mouse sensitivity: 0.002, clamped movement to prevent jitter
   - Camera moves in world-space with Y-axis rotation applied to movement vector

6. **Projection** (`projection.js`)
   - `worldToView(x, y, z, camera)` transforms world coordinates to camera-relative view space
   - Applies translation + yaw rotation + pitch rotation
   - Used by tiles to project vertices for rendering

## Key Conventions

- **Module Exports**: Use ES6 `import`/`export` (type: "module" in package.json)
- **Classes**: Used for Renderer and World; Game objects are plain objects with methods
- **Naming**:
  - Texture coordinates: `u0, v0, u1, v1` (normalized 0-1 range)
  - World positions: `x, y, z` (world-space) vs `va, vb, vc` (view-space after projection)
  - Grid positions: `gridX, gridZ` for terrain tiles (y is height)
- **Texture Atlas**: Sprite-based, use `getUV(col, row)` helper with epsilon padding (0.5px) to prevent bleeding
- **Depth Sorting**: Tiles calculate average depth of projected triangle for painter's algorithm
- **Near Plane**: `NEAR = 0.3` – triangles behind this are culled
- **Comments**: Minimal; some Swedish comments in tile.js reflect development language
- **Delta Time**: Passed as `dt` in seconds (not milliseconds) to update functions

## File Organization

```
src/
├── main.js                  # Entry point, game loop
├── init.js                  # Calls init() on all game objects
├── update.js                # Calls update(dt) on all game objects
├── render.js                # Calls render(renderer) on all game objects
├── Renderer.js              # WebGL2 renderer class
├── camera.js                # Camera class & instance
├── input.js                 # Input handling & camera control
├── world.js                 # World class for terrain generation
├── tile.js                  # Tile class & block geometry generation
├── gameObjects.js           # Game object registry
├── projection.js            # worldToView transformation
├── vertexShaderSource.js    # Vertex shader GLSL code
├── fragmentShaderSource.js  # Fragment shader GLSL code
└── assets/
    └── textures.png         # 128×32px sprite atlas
```

## Adding New Features

- **New Game Object**: Create class with `init()`, `update(dt)`, `render(renderer)` methods, then `addGameObject(obj)` in main.js or world.js
- **New Tile Type**: Add to `tileTypes` in world.js and texture UVs in `textureAtlas` in tile.js
- **Camera Behavior**: Modify `camera.js` or `input.js` – camera is global and used in projection
- **Shader Changes**: Edit `vertexShaderSource.js` or `fragmentShaderSource.js`, then update `Renderer.js` attribute bindings if vertex format changes
- **Optimization**: Consider frustum culling for tiles, or LOD for large grids
