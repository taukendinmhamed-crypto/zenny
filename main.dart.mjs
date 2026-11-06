// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      AC: Function.prototype.call.bind(DataView.prototype.setUint16),
      AD: x0 => x0.width,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      AH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      AI: (x0,x1) => { x0.min = x1 },
      AJ: x0 => x0.close(),
      AK: x0 => x0.cancel(),
      AL: (x0,x1) => x0.item(x1),
      AM: (x0,x1) => { x0.onerror = x1 },
      B: s => printToConsole(s),
      BB: b => !!b,
      BC: Function.prototype.call.bind(DataView.prototype.setUint8),
      BD: x0 => x0.screen,
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.v8BreakIterator,
      BH: (x0,x1) => { x0.value = x1 },
      BI: (x0,x1) => { x0.max = x1 },
      BJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      BK: x0 => x0.getReader(),
      BL: (x0,x1) => x0.item(x1),
      BM: (x0,x1) => { x0.oncancel = x1 },
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CC: Function.prototype.call.bind(DataView.prototype.setInt8),
      CD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: () => globalThis.Intl,
      CH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      CI: (x0,x1) => { x0.disabled = x1 },
      CJ: (x0,x1) => x0.decode(x1),
      CK: x0 => x0.read(),
      CL: x0 => x0.confidence,
      CM: (x0,x1) => { x0.onchange = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (x0,x1) => x0.focus(x1),
      DC: Function.prototype.call.bind(DataView.prototype.getInt8),
      DD: x0 => x0.tabIndex,
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: (x0,x1) => x0.segment(x1),
      DH: (x0,x1) => { x0.value = x1 },
      DI: (x0,x1) => { x0.scrollLeft = x1 },
      DJ: x0 => x0.displayHeight,
      DK: x0 => x0.value,
      DL: x0 => x0.transcript,
      DM: x0 => x0.type,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: () => ({}),
      EC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      ED: (x0,x1) => x0.contains(x1),
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: x0 => x0.index,
      EH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      EI: (x0,x1) => { x0.spellcheck = x1 },
      EJ: x0 => x0.displayWidth,
      EK: x0 => x0.done,
      EL: x0 => x0.length,
      EM: x0 => x0.lastModified,
      F: () => new Error().stack,
      FB: (o, p, v) => o[p] = v,
      FC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      FD: x0 => x0.activeElement,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: x0 => x0.next(),
      FH: x0 => x0.value,
      FI: (x0,x1) => { x0.disabled = x1 },
      FJ: x0 => x0.duration,
      FK: x0 => x0.body,
      FL: x0 => x0.length,
      FM: x0 => x0.name,
      G: s => JSON.stringify(s),
      GB: () => [],
      GC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      GD: x0 => x0.parentNode,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.value,
      GH: x0 => x0.selectionDirection,
      GI: (a, i) => a.splice(i, 1),
      GJ: x0 => x0.image,
      GK: x0 => x0.headers,
      GL: x0 => x0.results,
      GM: (x0,x1) => x0.item(x1),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (a, i) => a.push(i),
      HC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      HD: x0 => x0.tagName,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: x0 => x0.done,
      HH: x0 => x0.selectionStart,
      HI: a => a.pop(),
      HJ: () => globalThis.window.ImageDecoder,
      HK: x0 => x0.signal,
      HL: (x0,x1) => x0.getItem(x1),
      HM: x0 => x0.length,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Int8Array(x0),
      IC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      ID: x0 => x0.target,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: (o, m, a) => o[m].apply(o, a),
      IH: x0 => x0.selectionEnd,
      II: (map, o, v) => map.set(o, v),
      IJ: x0 => x0.status,
      IK: (x0,x1) => x0.transferFromImageBitmap(x1),
      IL: x0 => x0.localStorage,
      IM: x0 => x0.files,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      JD: x0 => x0.clientY,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: x0 => x0.iterator,
      JH: x0 => x0.value,
      JI: (map, o) => map.get(o),
      JJ: x0 => x0.response,
      JK: (x0,x1) => x0.getContext(x1),
      JL: (x0,x1) => x0.key(x1),
      JM: x0 => x0.target,
      K: o => o,
      KB: x0 => new Uint8Array(x0),
      KC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      KD: x0 => x0.clientX,
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: () => globalThis.Symbol,
      KH: x0 => x0.selectionDirection,
      KI: () => new WeakMap(),
      KJ: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      KK: (x0,x1) => { x0.height = x1 },
      KL: x0 => x0.length,
      KM: (x0,x1) => x0.replaceChildren(x1),
      L: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      LB: x0 => new Uint8ClampedArray(x0),
      LC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      LD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: s => s.toUpperCase(),
      LG: (x0,x1) => new Intl.Segmenter(x0,x1),
      LH: x0 => x0.selectionStart,
      LI: x0 => new WeakRef(x0),
      LJ: (x0,x1) => { x0.responseType = x1 },
      LK: (x0,x1) => { x0.width = x1 },
      LL: (x0,x1) => x0.removeItem(x1),
      LM: (x0,x1,x2) => x0.setAttribute(x1,x2),
      M: x0 => x0.index,
      MB: x0 => new Int16Array(x0),
      MC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      MD: x0 => x0.getBoundingClientRect(),
      ME: x0 => x0.matches,
      MF: x0 => x0.pop(),
      MG: x0 => x0.Segmenter,
      MH: x0 => x0.selectionEnd,
      MI: x0 => x0.deref(),
      MJ: () => new XMLHttpRequest(),
      MK: x0 => x0.height,
      ML: (x0,x1,x2) => x0.setItem(x1,x2),
      MM: (x0,x1) => { x0.accept = x1 },
      N: o => String(o),
      NB: x0 => new Uint16Array(x0),
      NC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      ND: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: x0 => x0.flags,
      NG: x0 => x0.buffer,
      NH: x0 => x0.keyCode,
      NI: () => globalThis.WeakRef,
      NJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      NK: x0 => x0.width,
      NL: (x0,x1) => x0.canShare(x1),
      NM: (x0,x1) => { x0.multiple = x1 },
      O: o => o === undefined,
      OB: x0 => new Int32Array(x0),
      OC: (x0,x1) => x0.querySelector(x1),
      OD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      OE: f => f.dartFunction,
      OF: (a, s) => a.join(s),
      OG: x0 => x0.wasmMemory,
      OH: (x0,x1) => x0.scrollIntoView(x1),
      OI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      OJ: x0 => globalThis.zennyOcr(x0),
      OK: x0 => x0.rasterEndMilliseconds,
      OL: (x0,x1) => x0.share(x1),
      OM: (x0,x1) => { x0.type = x1 },
      P: (x0,x1) => x0.exec(x1),
      PB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      PC: (x0,x1) => x0.item(x1),
      PD: Date.now,
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: (x0,x1) => x0.error(x1),
      PG: () => globalThis.window._flutter_skwasmInstance,
      PH: x0 => x0.multiViewEnabled,
      PI: (a, s, e) => a.slice(s, e),
      PJ: x0 => new Blob(x0),
      PK: x0 => x0.rasterStartMilliseconds,
      PL: x0 => x0.message,
      PM: () => globalThis.removeSplashFromWeb(),
      Q: (x0,x1) => { x0.lastIndex = x1 },
      QB: x0 => new Uint32Array(x0),
      QC: x0 => x0.length,
      QD: (handle) => clearTimeout(handle),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: () => globalThis.console,
      QG: () => new TextDecoder(),
      QH: (x0,x1) => x0.replaceWith(x1),
      QI: x0 => x0.naturalHeight,
      QJ: x0 => ({type: x0}),
      QK: x0 => x0.imageBitmaps,
      QL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      QM: (x0,x1) => x0.appendChild(x1),
      R: o => o,
      RB: x0 => new Float32Array(x0),
      RC: (x0,x1) => x0.querySelectorAll(x1),
      RD: (x0,x1) => x0.closest(x1),
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: s => s.trimRight(),
      RG: (d, digits) => d.toFixed(digits),
      RH: (x0,x1) => { x0.type = x1 },
      RI: x0 => x0.naturalWidth,
      RJ: (x0,x1) => new Blob(x0,x1),
      RK: x0 => x0.canvasKitMaximumSurfaces,
      RL: (x0,x1) => x0.createElement(x1),
      RM: (x0,x1,x2) => x0.addEventListener(x1,x2),
      S: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      SB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      SC: (x0,x1) => x0.getAttribute(x1),
      SD: x0 => x0.bottom,
      SE: (o, i) => o[i],
      SF: x0 => x0.blur(),
      SG: x0 => x0.maxHeight,
      SH: (x0,x1) => { x0.className = x1 },
      SI: (x0,x1) => x0.createElement(x1),
      SJ: x0 => x0.size,
      SK: x0 => x0.nextSibling,
      SL: x0 => x0.click(),
      SM: (x0,x1) => x0.removeChild(x1),
      T: o => o instanceof RegExp,
      TB: x0 => new Float64Array(x0),
      TC: x0 => x0.remove(),
      TD: x0 => x0.top,
      TE: o => o.length,
      TF: x0 => x0.button,
      TG: x0 => x0.maxWidth,
      TH: (x0,x1) => { x0.tabIndex = x1 },
      TI: (x0,x1) => { x0.pointerEvents = x1 },
      TJ: () => new XMLHttpRequest(),
      TK: (x0,x1) => x0.debug(x1),
      TL: x0 => x0.remove(),
      TM: x0 => x0.firstChild,
      U: (string, times) => string.repeat(times),
      UB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      UC: (x0,x1) => x0.appendChild(x1),
      UD: x0 => x0.right,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.innerHeight,
      UG: x0 => x0.minHeight,
      UH: (x0,x1) => { x0.name = x1 },
      UI: (x0,x1) => { x0.height = x1 },
      UJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      UK: x0 => x0.hostElement,
      UL: (o, a) => o + a,
      UM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      V: o => o,
      VB: x0 => new ArrayBuffer(x0),
      VC: (x0,x1) => x0.append(x1),
      VD: x0 => x0.left,
      VE: x0 => x0.language,
      VF: x0 => x0.innerWidth,
      VG: x0 => x0.minWidth,
      VH: (x0,x1) => { x0.placeholder = x1 },
      VI: (x0,x1) => { x0.width = x1 },
      VJ: x0 => x0.send(),
      VK: x0 => x0.location,
      VL: x0 => x0.children,
      VM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      W: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      WB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      WC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      WD: x0 => x0.clientY,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.height,
      WG: x0 => x0.debugSkipFontRetryDelay,
      WH: (x0,x1) => { x0.autocomplete = x1 },
      WI: x0 => x0.style,
      WJ: x0 => x0.type,
      WK: (x0,x1) => x0.getModifierState(x1),
      WL: x0 => x0.body,
      WM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      X: x0 => x0.dotAll,
      XB: (x0,x1,x2) => new DataView(x0,x1,x2),
      XC: x0 => x0.style,
      XD: x0 => x0.clientX,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.width,
      XG: x0 => x0.status,
      XH: (x0,x1) => { x0.name = x1 },
      XI: (x0,x1) => { x0.src = x1 },
      XJ: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      XK: x0 => x0.metaKey,
      XL: (x0,x1) => { x0.download = x1 },
      XM: x0 => x0.parentNode,
      Y: x0 => x0.unicode,
      YB: (o, p) => o[p],
      YC: x0 => x0.debugShowSemanticsNodes,
      YD: x0 => x0.changedTouches,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.clientHeight,
      YG: (x0,x1,x2) => x0.set(x1,x2),
      YH: (x0,x1) => { x0.placeholder = x1 },
      YI: () => globalThis.document,
      YJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      YK: x0 => x0.altKey,
      YL: (x0,x1) => { x0.display = x1 },
      YM: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      Z: x0 => x0.ignoreCase,
      ZB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      ZC: (x0,x1) => x0.warn(x1),
      ZD: x0 => x0.offsetY,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.clientWidth,
      ZG: x0 => x0.arrayBuffer(),
      ZH: (x0,x1) => { x0.action = x1 },
      ZI: x0 => x0.src,
      ZJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZK: x0 => x0.ctrlKey,
      ZL: x0 => x0.style,
      ZM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      a: x0 => x0.multiline,
      aB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      aC: x0 => x0.console,
      aD: x0 => x0.offsetX,
      aE: (x0,x1) => x0.unregister(x1),
      aF: (x0,x1) => { x0.content = x1 },
      aG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      aH: (x0,x1) => { x0.method = x1 },
      aI: x0 => x0.decode(),
      aJ: x0 => x0.response,
      aK: x0 => x0.isComposing,
      aL: (x0,x1) => { x0.href = x1 },
      aM: (x0,x1) => { x0.draggable = x1 },
      b: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      bB: o => o.byteOffset,
      bC: () => globalThis.window,
      bD: x0 => x0.type,
      bE: (x0,x1) => x0.contains(x1),
      bF: (x0,x1) => { x0.name = x1 },
      bG: (x0,x1) => x0.fetch(x1),
      bH: (x0,x1) => { x0.noValidate = x1 },
      bI: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      bJ: (x0,x1) => { x0.responseType = x1 },
      bK: x0 => x0.code,
      bL: () => globalThis.document,
      bM: x0 => x0.length,
      c: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      cB: o => o.buffer,
      cC: (o, c) => o instanceof c,
      cD: x0 => x0.maxTouchPoints,
      cE: (s) => +s,
      cF: x0 => x0.head,
      cG: x0 => x0.fontFallbackBaseUrl,
      cH: (x0,x1) => x0.removeAttribute(x1),
      cI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cJ: x0 => x0.vendor,
      cK: x0 => x0.repeat,
      cL: (x0,x1) => ({files: x0,title: x1}),
      cM: x0 => x0.getReader(),
      d: (x0,x1) => x0.didCreateEngineInitializer(x1),
      dB: Function.prototype.call.bind(DataView.prototype.getUint8),
      dC: (x0,x1) => x0[x1],
      dD: x0 => x0.platform,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => x0.removeChild(x1),
      dG: (handle) => clearInterval(handle),
      dH: x0 => x0.isConnected,
      dI: (x0,x1,x2) => x0.addEventListener(x1,x2),
      dJ: x0 => x0.navigator,
      dK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      dL: x0 => ({files: x0}),
      dM: x0 => x0.value,
      e: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eB: (b, o) => new DataView(b, o),
      eC: x0 => x0.length,
      eD: x0 => x0.body,
      eE: s => s.trim(),
      eF: x0 => x0.firstChild,
      eG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      eH: x0 => x0.click(),
      eI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eJ: () => globalThis.window,
      eK: x0 => x0.userAgent,
      eL: () => ({}),
      eM: x0 => x0.done,
      f: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      fB: (b, o, l) => new DataView(b, o, l),
      fC: (string, token) => string.split(token),
      fD: () => globalThis.document,
      fE: x0 => x0.classList,
      fF: x0 => x0.viewConstraints,
      fG: () => Date.now(),
      fH: (x0,x1) => x0.getElementsByClassName(x1),
      fI: x0 => x0.send(),
      fJ: x0 => globalThis.URL.createObjectURL(x0),
      fK: x0 => x0.abort(),
      fL: (x0,x1,x2) => new File(x0,x1,x2),
      fM: x0 => x0.read(),
      g: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      gB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      gC: o => o instanceof Array,
      gD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.hostElement,
      gG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      gH: (x0,x1) => x0.dispatchEvent(x1),
      gI: (x0,x1) => x0.revokeObjectURL(x1),
      gJ: o => o.byteLength,
      gK: () => new webkitSpeechRecognition(),
      gL: (x0,x1) => { x0.type = x1 },
      gM: x0 => x0.body,
      h: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      hB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      hC: (a, i) => a[i],
      hD: x0 => x0.hasFocus(),
      hE: x0 => x0.parent,
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      hH: (x0,x1) => x0.createEvent(x1),
      hI: (x0,x1) => { x0.src = x1 },
      hJ: () => new FileReader(),
      hK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hL: (x0,x1) => x0.querySelector(x1),
      hM: (x0,x1) => new OffscreenCanvas(x0,x1),
      i: x0 => new Promise(x0),
      iB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      iC: a => a.length,
      iD: x0 => x0.relatedTarget,
      iE: x0 => x0.timeStamp,
      iF: x0 => ({runApp: x0}),
      iG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      iH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      iI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      iJ: (x0,x1) => x0.readAsArrayBuffer(x1),
      iK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iL: (x0,x1) => x0.append(x1),
      iM: x0 => x0.assetBase,
      j: (x0,x1,x2) => x0.call(x1,x2),
      jB: (t, s) => t.set(s),
      jC: (x0,x1) => x0.test(x1),
      jD: x0 => x0.shiftKey,
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      jG: x0 => x0.history,
      jH: x0 => x0.readText(),
      jI: x0 => x0.naturalHeight,
      jJ: x0 => x0.result,
      jK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jL: (x0,x1) => { x0.id = x1 },
      jM: x0 => x0.loader,
      k: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      kB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      kC: x0 => x0.userAgent,
      kD: (decoder, codeUnits) => decoder.decode(codeUnits),
      kE: x0 => x0.buttons,
      kF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      kG: x0 => x0.search,
      kH: x0 => x0.clipboard,
      kI: x0 => x0.naturalWidth,
      kJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kL: x0 => globalThis.URL.revokeObjectURL(x0),
      kM: () => globalThis._flutter,
      l: x0 => new Array(x0),
      lB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      lC: x0 => x0.navigator,
      lD: () => new TextDecoder("utf-8", {fatal: true}),
      lE: x0 => x0.ctrlKey,
      lF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      lG: x0 => x0.location,
      lH: (x0,x1) => x0.writeText(x1),
      lI: x0 => x0.decode(),
      lJ: (x0,x1) => x0.getRandomValues(x1),
      lK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      lL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      m: o => [o],
      mB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      mC: Function.prototype.call.bind(String.prototype.toLowerCase),
      mD: () => new TextDecoder("utf-8", {fatal: false}),
      mE: x0 => x0.y,
      mF: () => typeof dartUseDateNowForTicks !== "undefined",
      mG: x0 => x0.pathname,
      mH: x0 => x0.unlock(),
      mI: (x0,x1) => { x0.decoding = x1 },
      mJ: () => globalThis.crypto,
      mK: (x0,x1) => { x0.onnomatch = x1 },
      mL: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      n: (o0, o1) => [o0, o1],
      nB: Function.prototype.call.bind(DataView.prototype.getUint32),
      nC: Object.is,
      nD: (a, i, v) => a[i] = v,
      nE: x0 => x0.x,
      nF: () => Date.now(),
      nG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      nH: (x0,x1) => x0.lock(x1),
      nI: (x0,x1) => { x0.crossOrigin = x1 },
      nJ: l => new DataView(new ArrayBuffer(l)),
      nK: (x0,x1) => { x0.onend = x1 },
      nL: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      o: (o0, o1, o2) => [o0, o1, o2],
      oB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      oC: x0 => x0.vendor,
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: () => 1000 * performance.now(),
      oG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      oH: x0 => x0.orientation,
      oI: (x0,x1) => x0.createObjectURL(x1),
      oJ: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      oK: (x0,x1) => { x0.onspeechstart = x1 },
      oL: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      p: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      pB: Function.prototype.call.bind(DataView.prototype.getInt32),
      pC: (x0,x1) => x0.createTextNode(x1),
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: (x0,x1) => x0.requestAnimationFrame(x1),
      pG: o => Object.keys(o),
      pH: (x0,x1) => x0.querySelector(x1),
      pI: x0 => x0.URL,
      pJ: x0 => x0.abort(),
      pK: (x0,x1) => { x0.onstart = x1 },
      pL: x0 => x0.height,
      q: (x0,x1,x2) => { x0[x1] = x2 },
      qB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      qC: (x0,x1) => { x0.id = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qG: x0 => x0.state,
      qH: (x0,x1) => { x0.title = x1 },
      qI: x0 => new Blob(x0),
      qJ: () => new AbortController(),
      qK: (x0,x1) => { x0.onerror = x1 },
      qL: x0 => x0.width,
      r: (o, p) => o[p],
      rB: o => o instanceof Uint16Array,
      rC: (x0,x1) => { x0.nonce = x1 },
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: x0 => x0.now(),
      rG: x0 => x0.hash,
      rH: (x0,x1) => x0.vibrate(x1),
      rI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      rJ: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      rK: x0 => x0.error,
      rL: (x0,x1) => x0.getContext(x1),
      s: () => globalThis,
      sB: Function.prototype.call.bind(DataView.prototype.getUint16),
      sC: x0 => x0.nonce,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: x0 => x0.performance,
      sG: x0 => x0.state,
      sH: x0 => x0.content,
      sI: x0 => new window.ImageDecoder(x0),
      sJ: (x0,x1) => globalThis.fetch(x0,x1),
      sK: x0 => x0.lang,
      sL: (x0,x1) => { x0.height = x1 },
      t: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      tB: o => o instanceof Int16Array,
      tC: () => globalThis.window.flutterConfiguration,
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: x0 => new Uint8Array(x0),
      tG: (x0,x1) => x0.go(x1),
      tH: x0 => x0.document,
      tI: x0 => x0.name,
      tJ: (x0,x1) => x0.get(x1),
      tK: x0 => x0.stop(),
      tL: (x0,x1) => { x0.width = x1 },
      u: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      uB: Function.prototype.call.bind(DataView.prototype.getInt16),
      uC: (x0,x1) => x0.attachShadow(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: (x0,x1,x2) => x0.slice(x1,x2),
      uG: x0 => x0.parentElement,
      uH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      uI: x0 => x0.repetitionCount,
      uJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      uK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      uL: x0 => x0.height,
      v: (x0,x1) => ({addView: x0,removeView: x1}),
      vB: o => o instanceof Uint8ClampedArray,
      vC: (x0,x1) => x0.createElement(x1),
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: (x0,x1) => x0.decode(x1),
      vG: (x0,x1) => x0.querySelectorAll(x1),
      vH: x0 => x0.id,
      vI: x0 => x0.frameCount,
      vJ: (x0,x1) => x0.forEach(x1),
      vK: x0 => x0.start(),
      vL: x0 => x0.width,
      w: (l, r) => l === r,
      wB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      wC: x0 => x0.scale,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: (x0,x1) => x0.adoptText(x1),
      wG: (x0,x1) => x0.removeProperty(x1),
      wH: x0 => x0.offsetHeight,
      wI: x0 => x0.selectedTrack,
      wJ: x0 => x0.name,
      wK: (x0,x1) => { x0.lang = x1 },
      wL: (x0,x1) => { x0.src = x1 },
      x: x0 => x0.random(),
      xB: Function.prototype.call.bind(DataView.prototype.setInt32),
      xC: x0 => x0.visualViewport,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: x0 => x0.first(),
      xG: (x0,x1) => x0.add(x1),
      xH: x0 => x0.offsetWidth,
      xI: x0 => x0.completed,
      xJ: x0 => x0.statusText,
      xK: (x0,x1) => { x0.continuous = x1 },
      xL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      y: () => globalThis.Math,
      yB: Function.prototype.call.bind(DataView.prototype.setUint32),
      yC: x0 => x0.devicePixelRatio,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: x0 => x0.next(),
      yG: x0 => x0.data,
      yH: x0 => x0.stopPropagation(),
      yI: x0 => x0.ready,
      yJ: x0 => x0.url,
      yK: (x0,x1) => { x0.interimResults = x1 },
      yL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      z: (x0,x1) => x0.prepend(x1),
      zB: Function.prototype.call.bind(DataView.prototype.setInt16),
      zC: x0 => x0.height,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: x0 => x0.current(),
      zG: (x0,x1) => { x0.scrollTop = x1 },
      zH: x0 => x0.disabled,
      zI: x0 => x0.tracks,
      zJ: x0 => x0.status,
      zK: (x0,x1) => { x0.onresult = x1 },
      zL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
