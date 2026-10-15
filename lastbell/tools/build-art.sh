#!/bin/sh
# concatenates tools/artsrc/*.js into js/art.js
cd "$(dirname "$0")" && cat artsrc/a_core.js artsrc/b_world.js artsrc/c_props1.js artsrc/c_props2.js artsrc/d_chars.js artsrc/e_scene.js $(ls artsrc/f_*.js artsrc/g_*.js 2>/dev/null) artsrc/h_export.js > ../js/art.js && node --check ../js/art.js && echo built $(wc -l < ../js/art.js) lines
