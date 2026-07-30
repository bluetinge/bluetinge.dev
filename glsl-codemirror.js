// Stream parser based syntax highlighting for GLSL ES 3.0
// Somewhat hacked together

import { 
  EditorState
} from "https://esm.sh/@codemirror/state@6.7.1";
import {
  EditorView, keymap,  lineNumbers, 
  highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, 
  drawSelection, dropCursor,
  rectangularSelection, crosshairCursor,
} from "https://esm.sh/@codemirror/view"
import {
  HighlightStyle, syntaxHighlighting, bracketMatching,
  indentOnInput, indentUnit,
  foldService, foldGutter, foldKeymap,
  LanguageSupport, StreamLanguage
} from "https://esm.sh/@codemirror/language@6.11.3";
import {
  defaultKeymap, 
  history, historyKeymap,
  undo, redo,
  selectGroupForward, selectLine, selectLineDown, selectAll
} from "https://esm.sh/@codemirror/commands"
import {
  openSearchPanel,
  closeSearchPanel
} from "https://esm.sh/@codemirror/search";
import {
  searchKeymap, highlightSelectionMatches
} from "https://esm.sh/@codemirror/search"
import {
  autocompletion, completionKeymap,
  closeBrackets, closeBracketsKeymap
} from "https://esm.sh/@codemirror/autocomplete"
import {
  lintKeymap
} from "https://esm.sh/@codemirror/lint"
import {
  oneDark
} from "https://esm.sh/@codemirror/theme-one-dark@6.1.3";
import {
  Tag,  tags
} from "https://esm.sh/@lezer/highlight@1.2.1";

/** Extensions **/

function getExtensions() {
  return  [
      // A line number gutter
      lineNumbers(),
      // A gutter with code folding markers
      foldGutter({
        openText: "▾",
        closedText: "▸"
      }),
      // Replace non-printable characters with placeholders
      highlightSpecialChars(),
      // The undo history
      history(),
      // Replace native cursor/selection with our own
      drawSelection(),
      // Show a drop cursor when dragging over the editor
      dropCursor(),
      // Allow multiple cursors/selections
      EditorState.allowMultipleSelections.of(true),
      // Re-indent lines when typing specific input
      indentOnInput(),
      // Highlight matching brackets near cursor
      bracketMatching(),
      // Automatically close brackets
      closeBrackets(),
      // Allow alt-drag to select rectangular regions
      rectangularSelection(),
      // Change the cursor to a crosshair when holding alt
      crosshairCursor(),
      // Style the current line specially
      highlightActiveLine(),
      // Style the gutter for current line specially
      highlightActiveLineGutter(),
      // Highlight text that matches the selected text
      highlightSelectionMatches(),
      keymap.of([
        // Closed-brackets aware backspace
        ...closeBracketsKeymap,
        // A large set of basic bindings
        ...defaultKeymap,
        // Search-related keys
        ...searchKeymap,
        // Redo/undo keys
        ...historyKeymap,
        // Code folding bindings
        ...foldKeymap,
        // Autocompletion keys
        ...completionKeymap,
        // Keys related to the linter system
        ...lintKeymap
      ]),
    // Autocomplete with GLSL terminology + typed terms
    autocompletion({
      override: [glslCompletionSource],
      activateOnTyping: true
    }),
  ];
}


/**Custom tags **/

const uniformNameTag = Tag.define(tags.variableName);
const attributeNameTag = Tag.define(tags.variableName);
const varyingNameTag = Tag.define(tags.variableName);
const outputNameTag = Tag.define(tags.variableName);
const constantNameTag = Tag.define(tags.variableName);
const functionNameTag = Tag.define(tags.variableName);
const builtinNameTag = Tag.define(tags.variableName);
const paramNameTag = Tag.define(tags.variableName);
const localNameTag = Tag.define(tags.variableName);
const structNameTag = Tag.define(tags.typeName);
const unknownMetaTag = Tag.define(tags.meta);
const unknownNameTag = Tag.define(tags.variableName);

/** Language-specific words **/

function words(text) {
  return new Set(
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
}

const qualifiers = words(`
  const
  uniform
  buffer
  shared
  attribute
  varying
  coherent
  volatile
  restrict
  readonly
  writeonly
  layout
  centroid
  flat
  smooth
  noperspective
  patch
  sample
  invariant
  precise
  in
  out
  inout
  lowp
  mediump
  highp
  precision
`);

const controlKeywords = words(`
  break
  continue
  do
  for
  while
  switch
  case
  default
  if
  else
  discard
  return
  struct
  subroutine
`);

const scalarTypes = words(`
  void
  bool
  int
  uint
  float
  double
  atomic_uint
`);

const vectorTypes = words(`
  vec2
  vec3
  vec4

  ivec2
  ivec3
  ivec4

  uvec2
  uvec3
  uvec4

  bvec2
  bvec3
  bvec4

  dvec2
  dvec3
  dvec4
`);

const matrixTypes = words(`
  mat2
  mat3
  mat4

  mat2x2
  mat2x3
  mat2x4

  mat3x2
  mat3x3
  mat3x4

  mat4x2
  mat4x3
  mat4x4

  dmat2
  dmat3
  dmat4

  dmat2x2
  dmat2x3
  dmat2x4

  dmat3x2
  dmat3x3
  dmat3x4

  dmat4x2
  dmat4x3
  dmat4x4
`);

const samplerTypes = words(`
  sampler1D
  sampler1DShadow
  sampler1DArray
  sampler1DArrayShadow

  isampler1D
  isampler1DArray

  usampler1D
  usampler1DArray

  sampler2D
  sampler2DShadow
  sampler2DArray
  sampler2DArrayShadow

  isampler2D
  isampler2DArray

  usampler2D
  usampler2DArray

  sampler2DRect
  sampler2DRectShadow
  isampler2DRect
  usampler2DRect

  sampler2DMS
  isampler2DMS
  usampler2DMS

  sampler2DMSArray
  isampler2DMSArray
  usampler2DMSArray

  sampler3D
  isampler3D
  usampler3D

  samplerCube
  samplerCubeShadow
  isamplerCube
  usamplerCube

  samplerCubeArray
  samplerCubeArrayShadow
  isamplerCubeArray
  usamplerCubeArray

  samplerBuffer
  isamplerBuffer
  usamplerBuffer

  sampler3DRect
`);

const imageTypes = words(`
  image1D
  iimage1D
  uimage1D

  image1DArray
  iimage1DArray
  uimage1DArray

  image2D
  iimage2D
  uimage2D

  image2DArray
  iimage2DArray
  uimage2DArray

  image2DRect
  iimage2DRect
  uimage2DRect

  image2DMS
  iimage2DMS
  uimage2DMS

  image2DMSArray
  iimage2DMSArray
  uimage2DMSArray

  image3D
  iimage3D
  uimage3D

  imageCube
  iimageCube
  uimageCube

  imageCubeArray
  iimageCubeArray
  uimageCubeArray

  imageBuffer
  iimageBuffer
  uimageBuffer
`);

const reservedWords = words(`
  common
  partition
  active
  asm
  class
  union
  enum
  typedef
  template
  this
  resource
  goto
  inline
  noinline
  public
  static
  extern
  external
  interface
  long
  short
  half
  fixed
  unsigned
  superp
  input
  output
  hvec2
  hvec3
  hvec4
  fvec2
  fvec3
  fvec4
  filter
  sizeof
  cast
  namespace
  using
`);

const typeNames = new Set([
  ...scalarTypes,
  ...vectorTypes,
  ...matrixTypes,
  ...samplerTypes,
  ...imageTypes
]);

const preprocessorDirectives = words(`
  define
  undef
  if
  ifdef
  ifndef
  else
  elif
  endif
  error
  pragma
  extension
  version
  line
`);

const preprocessorSyntax = words(`
  defined
  es
`)

const predefinedMacros = words(`
  __LINE__
  __VERSION__
  __FILE__
  GL_ES
`);

const specialVariables = words(`
  gl_DrawID
  gl_FragCoord
  gl_FragDepth
  gl_FrontFacing
  gl_InstanceID
  gl_PointCoord
  gl_PointSize
  gl_Position
  gl_VertexID

  gl_MaxVertexAttribs
  gl_MaxVertexUniformVectors
  gl_MaxVertexOutputVectors
  gl_MaxFragmentInputVectors
  gl_MaxVertexTextureImageUnits
  gl_MaxCombinedTextureImageUnits
  gl_MaxTextureImageUnits
  gl_MaxFragmentUniformVectors
  gl_MaxDrawBuffers
  gl_MinProgramTexelOffset
  gl_MaxProgramTexelOffset

  gl_DepthRangeParameters
  gl_DepthRange
`);

const builtinFunctions = words(`
  radians
  degrees

  sin
  cos
  tan
  asin
  acos
  atan

  sinh
  cosh
  tanh
  asinh
  acosh
  atanh

  pow
  exp
  log
  exp2
  log2
  sqrt
  inversesqrt

  abs
  sign
  floor
  trunc
  round
  roundEven
  ceil
  fract
  mod
  modf
  min
  max
  clamp
  mix
  step
  smoothstep
  isnan
  isinf

  floatBitsToInt
  floatBitsToUint
  intBitsToFloat
  uintBitsToFloat

  packSnorm2x16
  unpackSnorm2x16
  packUnorm2x16
  unpackUnorm2x16
  packHalf2x16
  unpackHalf2x16

  length
  distance
  dot
  cross
  normalize
  faceforward
  reflect
  refract

  matrixCompMult
  outerProduct
  transpose
  determinant
  inverse

  lessThan
  lessThanEqual
  greaterThan
  greaterThanEqual
  equal
  notEqual
  any
  all
  not

  textureSize
  texture
  textureProj
  textureLod
  textureOffset
  texelFetch
  texelFetchOffset
  textureProjOffset
  textureLodOffset
  textureProjLod
  textureProjLodOffset
  textureGrad
  textureGradOffset
  textureProjGrad
  textureProjGradOffset

  dFdx
  dFdy
  fwidth
`);

/** Autocomplete **/

const CompletionState = {
  state: null,
  position: null,
}

function glslCompletionSource(context) {
  const state = CompletionState.state;
  if(!state) return null;

  const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_]*/);

  if (!context.explicit) {
    if (!word || word.text.length < 4) {
      return null;
    }
  }

  return {
    from: word ? word.from : context.pos,
    options: [
      ...[...state.uniforms].map((label) => ({
        label,
        type: "variable",
        detail: "uniform"
      })),
      
      ...[...state.attributes].map((label) => ({
        label,
        type: "variable",
        detail: "in"
      })),
      
      ...[...state.varyings].map((label) => ({
        label,
        type: "variable",
        detail: "out"
      })),

      ...[...state.constants].map((label) => ({
        label,
        type: "variable",
        detail: "const"
      })),
      
      ...[...state.macros].map((label) => ({
        label,
        type: "keyword",
      })),

      ...[...state.params].map((label) => ({
        label,
        type: "variable",
      })),
      
      ...[...state.locals[state.locals.length-1]].map((label) => ({
        label,
        type: "variable",
      })),

      ...[...state.structs].map((label) => ({
        label,
        type: "typename",
      })),

      ...[...state.properties].map((label) => ({
        label,
        type: "property",
      })),

      ...[...state.functions].map((label) => ({
        label,
        type: "function"
      })),
      
      ...[...typeNames].map((label) => ({
        label,
        type: "typename"
      })),
      
      ...[...specialVariables].map((label) => ({
        label,
        type: "variable"
      })),
      
      ...[...builtinFunctions].map((label) => ({
        label,
        type: "function"
      })),
    ]
  };
}

/** Token parsing **/

const operatorRE =
  /^(?:<<=|>>=|\+\+|--|<<|>>|<=|>=|==|!=|&&|\|\||\^\^|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|##|[+\-*\/%<>=!&|^~?:])/;

const punctuationRE = /^[;,\.\[\]()]/;

const identifierRE = /^[A-Za-z_][A-Za-z0-9_]*/;

const swizzleRE = /^([w-z]{1,4}|[r|g|b|a]{1,4}|[s|t|p|q]{1,4})$/;

function tokenBase(stream, state) {
  if (stream.sol()) {
    const indentation = stream.match(/^\s*/, false)?.[0] ?? "";

    if (
      stream.string
        .slice(stream.pos + indentation.length)
        .startsWith("#")
    ) {
      stream.eatSpace();
      stream.next();

      state.inPreprocessor = true;
      state.expectingPreprocessorDirective = true;

      return "meta";
    }
  }

  if (stream.eatSpace()) {
    return null;
  }

  if (stream.match("//")) {
    stream.skipToEnd();
    return "lineComment";
  }

  if (stream.match("/*")) {
    state.inBlockComment = true;
    return tokenBlockComment(stream, state);
  }

  if (stream.peek() === '"') {
    stream.next();
    state.inString = true;
    return tokenString(stream, state);
  }

  // Hexadecimal integer literals.
  if (stream.match(/^0[xX][0-9A-Fa-f]+[uU]?/)) {
    if(state.inPreprocessor && !state.expectingPreprocessorDirective) return "meta";
    return "number";
  }

  // Decimal and floating-point literals:
  // 1, 1u, 1.0, .5, 1., 1e-3, 1.0f
  if (
    stream.match(
      /^(?:(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?[fF]?|\d+[eE][+-]?\d+[fF]?|\d+[uU]?)/
    )
  ) {
    if(state.inPreprocessor && !state.expectingPreprocessorDirective) return "meta";
    return "number";
  }

  const identifier = stream.match(identifierRE);

  if (identifier) {
    const word = identifier[0];

    if ( state.inPreprocessor ) {
      if( state.expectingPreprocessorDirective ) {
        state.expectingPreprocessorDirective = false;

        if(word=="define") {
          state.declarationKind = "macroName";
        }
          
        if (preprocessorDirectives.has(word)) {
          return "meta";
        }
      }
      
      if(state.declarationKind == "macroName") {
        state.declarationKind = null;
        state.declarationSawType = false;
        state.macros.add(word);
        return "macroName";
      }
      
      if(preprocessorSyntax.has(word)) {
        return "meta";
      }
      
      if (predefinedMacros.has(word) || state.macros.has(word)) {
        return "macroName";
      }

      if (specialVariables.has(word)) {
        return "variableName.special";
      }
      
      return "unknownMeta";
    }

    if (state.depth === 0) {
      if(state.paren === 0) {
        if (word == "struct" ) {
          state.declarationKind = "structName";
          state.declarationSawType = true;
          return "keyword";
        }
        
        if (word === "uniform") {
          state.declarationKind = "uniformName";
          state.declarationSawType = false;
          return "modifier";
        }

        if (word === "attribute" || word == "in") { //if vertex...
          state.declarationKind = "attributeName";
          state.declarationSawType = false;
          return "modifier";
        }

        if (word === "varying" || word == "out") { // in if fragment...
          state.declarationKind = "varyingName";
          state.declarationSawType = false;
          return "modifier";
        }

        // if (word === "out") {
          // state.declarationKind = "outputName";
          // state.declarationSawType = false;
          // return "modifier";
        // }
        
        if (word === "const") {
          state.declarationKind = "constantName";
          state.declarationSawType = false;
          return "modifier";
        }
        
        if(state.declarationKind === null) {
          state.declarationKind = "functionName";
          state.declarationSawType = false;
        }
      }
      else if(state.declarationKind === "functionName") { // paren > 0
          state.declarationKind = "paramName";
          state.declarationSawType = false;
      }
    }
    else if(state.declarationKind === null){
      state.declarationKind = "localName";
      state.declarationSawType = false;
    }

    if(state.macros.has(word)) {
      return "macroName";
    }
    
    if(state.sawDot) {
      if(swizzleRE.test(word) || state.properties.has(word)) return "propertyName";
      else return "invalid"
    }
    
    if (word === "true" || word === "false") {
      return "bool";
    }

    if (qualifiers.has(word)) {
      return "modifier";
    }

    if (controlKeywords.has(word)) {
      return "keyword";
    }

    if (typeNames.has(word) || state.structs.has(word)) {
      if (state.declarationKind !== null) {
        state.declarationSawType = true;
      }
      if(state.structs.has(word)) return "structName";

      return "typeName";
    }

    if (reservedWords.has(word)) {
      return "invalid";
    }

    if (predefinedMacros.has(word)) {
      return "macroName";
    }

    if (
      state.declarationKind !== null &&
      state.declarationSawType
    ) {
      const declarationKind = state.declarationKind;

      switch (declarationKind) {
        case "uniformName":
          state.uniforms.add(word);
          break;

        case "attributeName":
          state.attributes.add(word);
          break;

        case "varyingName":
          state.varyings.add(word);
          break;

        case "outputName":
          state.outputs.add(word);
          break;
          
        case "constantName":
          state.constants.add(word);
          break;
          
        case "functionName":
          if(stream.peek()==="(") state.functions.add(word);
          else {
            state.locals[0].add(word);
            return "localName";
          }
          break;
          
        case "paramName":
          if(state.paren > 0 && state.depth == 0) state.params.add(word);
          break;
          
        case "localName":
          if(state.depth < state.locals.length) state.locals[state.depth].add(word);
          break;
          
        case "structName":
          state.structs.add(word);
          break;
          
        case "propertyName":
          state.properties.add(word);
          break;
      }
      // for for loops
      state.declarationSawType = state.paren==0? null: 0;
      return declarationKind;
    }
    
    for (const locals of state.locals.toReversed()) {
      if(locals.has(word)) return "localName";
    }

    if (state.params.has(word)) {
      return "paramName";
    }

    if (state.uniforms.has(word)) {
      return "uniformName";
    }

    if (state.attributes.has(word)) {
      return "attributeName";
    }

    if (state.varyings.has(word)) {
      return "varyingName";
    }

    if (state.outputs.has(word)) {
      return "outputName";
    }
    
    if (state.constants.has(word)) {
      return "constantName";
    }
    
    if (state.functions.has(word)) {
      return "functionName";
    }

    if (specialVariables.has(word)) {
      return "variableName.special";
    }

    if (builtinFunctions.has(word)) {
      return "builtinName";
    }

    return "unknownName";
  }

  if(state.declarationKind !== null) {
    if(stream.peek() !== "," && stream.peek() !== "]") {
      if(state.declarationSawType) state.declarationSawType = null;
    } else if ((state.declarationSawType === null && state.paren===0) || (state.declarationSawType === 0 && state.paren===1)) {
      state.declarationSawType = true;
    }
  }

  if(stream.peek() === ".") {
    state.sawDot = true;
  }
  else state.sawDot = false;

  if (stream.peek() === "(") {
    state.paren++;
  }
  if (stream.peek() === ")") {
    state.paren--;
    if(state.paren==0 && state.declarationKind == "paramName") state.declarationKind = null;
    if(state.paren < 0) { state.paren = 0; stream.next(); return "invalid"; }
  }

  if (stream.match(operatorRE)) {
    return "operator";
  }
  
  if (stream.peek() === "{") {
    stream.next();
    state.depth++;
    state.locals.push(new Set());
    state.declarationKind = state.declarationKind === "structName"? "propertyName" : null;
    state.declarationSawType = false;
    return "brace";
  }

  if (stream.peek() === "}") {
    stream.next();
    state.depth--;
    if(state.depth <= 0) {
      state.params.clear();
      if(state.locals.length > 1) state.locals.pop();
      if(state.depth < 0) {
        state.depth = 0;
        return "invalid";
      }
    } 
    state.declarationKind = null;
    state.declarationSawType = false;
    return "brace";
  }

  if (stream.peek() === ";") {
    stream.next();
    state.declarationKind = state.declarationKind === "propertyName"? "propertyName" : null;
    state.declarationSawType = false;
    return "punctuation";
  }

  if (stream.match(punctuationRE)) {
    return "punctuation";
  }

  // Ensure malformed or unknown input always advances.
  stream.next();
  return null;
}

function tokenBlockComment(stream, state) {
  let previous = "";

  while (!stream.eol()) {
    const current = stream.next();

    if (previous === "*" && current === "/") {
      state.inBlockComment = false;
      break;
    }

    previous = current;
  }

  return "blockComment";
}

function tokenString(stream, state) {
  let escaped = false;

  while (!stream.eol()) {
    const current = stream.next();

    if (current === '"' && !escaped) {
      state.inString = false;
      break;
    }

    if (current === "\\" && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  return "string";
}

/** StreamParser and GLSLLanguage **/

function copyState(state) {
  return { 
    ...state,
    uniforms: new Set(state.uniforms),
    attributes: new Set(state.attributes),
    varyings: new Set(state.varyings),
    outputs: new Set(state.outputs),
    constants: new Set(state.constants),
    functions: new Set(state.functions),
    macros: new Set(state.macros),
    params: new Set(state.params),
    locals: structuredClone(state.locals),
    structs: new Set(state.structs),
    properties: new Set(state.properties),
  };
}

export const glslLanguage = StreamLanguage.define({
  name: "glsl-es-300",

  tokenTable: {
    uniformName: uniformNameTag,
    attributeName: attributeNameTag,
    varyingName: varyingNameTag,
    outputName: outputNameTag,
    constantName: constantNameTag,
    functionName: functionNameTag,
    builtinName: builtinNameTag,
    paramName: paramNameTag,
    localName: localNameTag,
    structName: structNameTag,
    unknownMeta: unknownMetaTag,
    unknownName: unknownNameTag
  },

  startState() {
    return {
      inBlockComment: false,
      inString: false,
      inPreprocessor: false,
      expectingPreprocessorDirective: false,
      depth: 0,
      paren: 0,
      sawDot: false,
      characters: 0,

      declarationKind: null,
      declarationSawType: false,
      
      uniforms: new Set(),
      attributes: new Set(),
      varyings: new Set(),
      outputs: new Set(),
      constants: new Set(),
      functions: new Set(),
      macros: new Set(),
      params: new Set(),
      locals: [new Set()],
      structs: new Set(),
      properties: new Set()
    };
  },

  copyState: copyState,

  token(stream, state) {
    if (stream.sol()) {
      state.inPreprocessor = false;
      state.expectingPreprocessorDirective = false;
      
      if(CompletionState.position !== null 
      && CompletionState.state === null
      && state.characters + stream.string.length + 1 >= CompletionState.position ) {
        CompletionState.state = copyState(state);
      }
      state.characters += stream.string.length + 1;
    }

    if (state.inBlockComment) {
      return tokenBlockComment(stream, state);
    }

    if (state.inString) {
      return tokenString(stream, state);
    }

    return tokenBase(stream, state);
  },

  indent(state, textAfter, context) {
    const closesBlock = /^\s*}/.test(textAfter);

    return (
      Math.max(
        0,
        state.depth - (closesBlock ? 1 : 0)
      ) * context.unit
    );
  },

  languageData: {
    commentTokens: {
      line: "//",
      block: {
        open: "/*",
        close: "*/"
      }
    },

    closeBrackets: {
      brackets: [
        "(",
        "[",
        "{",
        "'",
        '"'
      ]
    },

    indentOnInput: /^\s*}$/
  }
});

/** Fold service **/

function findFoldStart(text, lineStart, lineEnd) {
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let position = 0; position < lineEnd; position++) {
    const current = text[position];
    const next = text[position + 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
      }

      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        position++;
      }

      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }

      continue;
    }

    if (current === "/" && next === "/") {
      inLineComment = true;
      position++;
      continue;
    }

    if (current === "/" && next === "*") {
      if (position >= lineStart) {
        return {
          type: "comment",
          position
        };
      }

      inBlockComment = true;
      position++;
      continue;
    }

    if (current === '"') {
      inString = true;
      continue;
    }

    if (current === "{" && position >= lineStart) {
      return {
        type: "brace",
        position
      };
    }
  }

  return null;
}

function findBraceFoldEnd(text, openingPosition) {
  let depth = 1;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (
    let position = openingPosition + 1;
    position < text.length;
    position++
  ) {
    const current = text[position];
    const next = text[position + 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
      }

      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        position++;
      }

      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }

      continue;
    }

    if (current === "/" && next === "/") {
      inLineComment = true;
      position++;
      continue;
    }

    if (current === "/" && next === "*") {
      inBlockComment = true;
      position++;
      continue;
    }

    if (current === '"') {
      inString = true;
      continue;
    }

    if (current === "{") {
      depth++;
      continue;
    }

    if (current === "}") {
      depth--;

      if (depth === 0) {
        return position;
      }
    }
  }

  return null;
}

function findCommentFoldEnd(text, openingPosition) {
  const closingPosition = text.indexOf(
    "*/",
    openingPosition + 2
  );

  return closingPosition === -1
    ? null
    : closingPosition + 2;
}

export const glslFolding = foldService.of(
  (state, lineStart, lineEnd) => {
    const text = state.doc.toString();

    const start = findFoldStart(
      text,
      lineStart,
      lineEnd
    );

    if (!start) {
      return null;
    }

    const end =
      start.type === "brace"
        ? findBraceFoldEnd(text, start.position)
        : findCommentFoldEnd(text, start.position);

    if (end === null) {
      return null;
    }

    // Only offer a fold when the range spans multiple lines.
    const startLine = state.doc.lineAt(start.position);
    const endLine = state.doc.lineAt(end);

    if (startLine.number === endLine.number) {
      return null;
    }

    if (start.type === "brace") {
      return {
        // Preserve the opening brace.
        from: start.position + 1,

        // Preserve the closing brace.
        to: end
      };
    }

    return {
      // Preserve the opening /* marker.
      from: start.position + 2,

      // Preserve the closing */ marker.
      to: end - 2
    };
  }
);

/** Bundle **/

export function glslES300() {
  return new LanguageSupport(
    glslLanguage,
    [
      indentUnit.of("  "),
      glslFolding,
      glslLanguage.data.of({
        autocomplete: glslCompletionSource
      })
    ]
  );
}

export const glsl = glslES300();

/** Style **/

export const glslHighlightStyle =
  HighlightStyle.define([
    {
      tag: tags.lineComment,
      color: "#58ABAB",
      fontStyle: "italic"
    },
    {
      tag: tags.blockComment,
      color: "#72C4C4",
      fontStyle: "italic"
    },
    {
      tag: [
        tags.variableName,
        tags.propertyName
      ],
      color: "#FFFFFF"
    },
    {
      tag: tags.number,
      color: "#80FFFF",
      fontWeight: "bold"
    },
    {
      tag: [
        tags.keyword,
        tags.modifier,
        tags.typeName,
        tags.bool
      ],
      color: "#80FF80",
      fontWeight: "bold"
    },
    {
      tag: unknownMetaTag,
      color: "#FF8040",
    },
    {
      tag: tags.meta,
      color: "#FF8040",
      fontWeight: "bold"
    },
    {
      tag: tags.macroName,
      color: "#FF8040",
      fontWeight: "bold"
    },
    {
      tag: tags.special(tags.variableName),
      color: "#FFAA37",
      fontWeight: "bold"
    },
    {
      tag: builtinNameTag,
      color: "#FFFF80",
      fontWeight: "bold"
    },
    {
      tag: uniformNameTag,
      color: "#80FFFF"
    },
    {
      tag: attributeNameTag,
      color: "#FFA54A",
    },
    {
      tag: varyingNameTag,
      color: "#EFA6FF",
    },
    {
      tag: outputNameTag,
      color: "#EFA6FF",
    },
    {
      tag: constantNameTag,
      color: "#488cfa",
      fontWeight: "bold",
      fontStyle: "italic"
    },
    {
      tag: functionNameTag,
      color: "#FFFFFF",
      fontWeight: "bold"
    },
    {
      tag: paramNameTag,
      color: "#c4ff4d",
    },
    {
      tag: localNameTag,
      color: "#FFFFFF",
    },
    {
      tag: [
        tags.operator,
        tags.brace,
        tags.paren,
        tags.squareBracket,
        tags.punctuation
      ],
      color: "#AFAF61",
      fontWeight: "bold"
    },
    {
      tag: tags.string,
      color: "#FFFF80"
    },
    {
      tag: unknownNameTag,
      color: "#CCC3B4",
    },
    {
      tag: tags.invalid,
      color: "#FC0394",
      textDecoration: "underline"
    }
  ]);

export const glslTheme =
  syntaxHighlighting(
    glslHighlightStyle
  );
  
// Toolbar 

async function copySelection(editor) {
  const { from, to } = editor.state.selection.main;

  if (from === to) {
    return;
  }

  const text = editor.state.sliceDoc(from, to);
  await navigator.clipboard.writeText(text);
}

async function cutSelection(editor) {
  const { from, to } = editor.state.selection.main;

  if (from === to) {
    return;
  }

  const text = editor.state.sliceDoc(from, to);

  await navigator.clipboard.writeText(text);

  editor.dispatch({
    changes: {
      from,
      to,
      insert: ""
    },
    selection: {
      anchor: from
    },
    userEvent: "delete.cut"
  });

  editor.focus();
}

async function makeSelection(editor) {
  const { from, to } = editor.state.selection.main;

  if (from === to) {
    selectLine(editor);
  }
  else selectLineDown(editor);
}

async function pasteAtSelection(editor) {
  const text = await navigator.clipboard.readText();

  editor.dispatch(
    editor.state.replaceSelection(text)
  );

  editor.focus();
}

function connectEditorToolbar(editor) {
  const commands = {
    undo,
    redo,
    find: openSearchPanel,
    selectnext: selectGroupForward,
    select: makeSelection,
    selectall: selectAll,
    cut: cutSelection,
    copy: copySelection,
    paste: pasteAtSelection
  };

  const toolbar = document.getElementById("editor-toolbar");

  if(toolbar) {
    toolbar.addEventListener("pointerdown", async (event) => {
      const button = event.target.closest("[data-command]");

      if (!button) {
        return;
      }

      event.preventDefault();

      const name = button.dataset.command;
      const command = commands[name];

      if (!command) {
        return;
      }

      try {
        await command(editor);
      } catch (error) {
        console.error(`${name} failed:`, error);
      }

      if (name !== "find") {
        editor.focus();
      }
    });
  }
}
  
  
// The actual editor
   
export const initCodeMirror = function (parent, startValue, onChange) {
  const editor = new EditorView({
    state: EditorState.create({
      doc: startValue,
      extensions: [
        getExtensions(),
        oneDark,
        glsl,
        glslTheme,
        EditorView.lineWrapping,

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString());
          }
        })
      ]
    }),

    parent: parent,
    dispatchTransactions: (trs) => {
      CompletionState.position = null;
      for (const tr of trs) {
        if (tr.selection && tr.selection.ranges) {
          for (const r of tr.selection.ranges) {
            if (r.from) CompletionState.position = r.from;
          }
        }
      }
      editor.update(trs);
    }
  });

  connectEditorToolbar(editor);

  return {
    view: editor,

    getCode() {
      return editor.state.doc.toString();
    },

    setCode(code) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: code
        }
      });
    },

    focus() {
      editor.focus();
    },

    destroy() {
      editor.destroy();
    }
  };
};
