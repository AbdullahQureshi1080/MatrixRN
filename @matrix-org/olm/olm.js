// @license magnet:?xt=urn:btih:8e4f440f4c65981c5bf93c76d35135ba5064d8b7&dn=apache-2.0.txt Apache-2.0
// @source: https://gitlab.matrix.org/matrix-org/olm/-/tree/3.2.12

var Olm = (function () {
  var olm_exports = {};
  var onInitSuccess;
  var onInitFail;

  var Module = (function () {
    var _scriptDir =
      typeof document !== 'undefined' && document.currentScript
        ? document.currentScript.src
        : undefined;
    if (typeof __filename !== 'undefined')
      _scriptDir = _scriptDir || __filename;
    return function (Module) {
      Module = Module || {};

      var a;
      a || (a = typeof Module !== 'undefined' ? Module : {});
      var aa, ba;
      a.ready = new Promise(function (b, c) {
        aa = b;
        ba = c;
      });
      var g;
      if ('undefined' !== typeof window)
        g = function (b) {
          window.crypto.getRandomValues(b);
        };
      else if (module.exports) {
        var ca = require('crypto-js');
        g = function (b) {
          var c = ca.randomBytes(b.length);
          b.set(c);
        };
        process = global.process;
      } else throw Error('Cannot find global to attach library to');
      if ('undefined' !== typeof OLM_OPTIONS)
        for (var da in OLM_OPTIONS)
          OLM_OPTIONS.hasOwnProperty(da) && (a[da] = OLM_OPTIONS[da]);
      a.onRuntimeInitialized = function () {
        h = a._olm_error();
        olm_exports.PRIVATE_KEY_LENGTH = a._olm_pk_private_key_length();
        onInitSuccess && onInitSuccess();
      };
      a.onAbort = function (b) {
        onInitFail && onInitFail(b);
      };
      var ea = {},
        l;
      for (l in a) a.hasOwnProperty(l) && (ea[l] = a[l]);
      var ha = 'object' === typeof window,
        ia = 'function' === typeof importScripts,
        m = '',
        ja,
        ka,
        la,
        n,
        q;
      if (
        'object' === typeof process &&
        'object' === typeof process.versions &&
        'string' === typeof process.versions.node
      )
        (m = ia ? require('path').dirname(m) + '/' : __dirname + '/'),
          (ja = function (b, c) {
            n || (n = require('react-native-fs'));
            q || (q = require('path'));
            b = q.normalize(b);
            return n.readFileSync(b, c ? null : 'utf8');
          }),
          (la = function (b) {
            b = ja(b, !0);
            b.buffer || (b = new Uint8Array(b));
            b.buffer || r('Assertion failed: undefined');
            return b;
          }),
          (ka = function (b, c, d) {
            n || (n = require('react-native-fs'));
            q || (q = require('path'));
            b = q.normalize(b);
            n.readFile(b, function (e, f) {
              e ? d(e) : c(f.buffer);
            });
          }),
          1 < process.argv.length && process.argv[1].replace(/\\/g, '/'),
          process.argv.slice(2),
          process.on('uncaughtException', function (b) {
            throw b;
          }),
          process.on('unhandledRejection', function (b) {
            throw b;
          }),
          (a.inspect = function () {
            return '[Emscripten Module object]';
          });
      else if (ha || ia)
        ia
          ? (m = self.location.href)
          : 'undefined' !== typeof document &&
            document.currentScript &&
            (m = document.currentScript.src),
          _scriptDir && (m = _scriptDir),
          0 !== m.indexOf('blob:')
            ? (m = m.substr(0, m.replace(/[?#].*/, '').lastIndexOf('/') + 1))
            : (m = ''),
          (ja = function (b) {
            var c = new XMLHttpRequest();
            c.open('GET', b, !1);
            c.send(null);
            return c.responseText;
          }),
          ia &&
            (la = function (b) {
              var c = new XMLHttpRequest();
              c.open('GET', b, !1);
              c.responseType = 'arraybuffer';
              c.send(null);
              return new Uint8Array(c.response);
            }),
          (ka = function (b, c, d) {
            var e = new XMLHttpRequest();
            e.open('GET', b, !0);
            e.responseType = 'arraybuffer';
            e.onload = function () {
              200 == e.status || (0 == e.status && e.response)
                ? c(e.response)
                : d();
            };
            e.onerror = d;
            e.send(null);
          });
      a.print || console.log.bind(console);
      var ma = a.printErr || console.warn.bind(console);
      for (l in ea) ea.hasOwnProperty(l) && (a[l] = ea[l]);
      ea = null;
      var na;
      a.wasmBinary && (na = a.wasmBinary);
      var noExitRuntime = a.noExitRuntime || !0;
      'object' !== typeof WebAssembly && r('no native wasm support detected');
      function t(b) {
        var c = 'i8';
        '*' === c.charAt(c.length - 1) && (c = 'i32');
        switch (c) {
          case 'i1':
            u[b >> 0] = 0;
            break;
          case 'i8':
            u[b >> 0] = 0;
            break;
          case 'i16':
            oa[b >> 1] = 0;
            break;
          case 'i32':
            v[b >> 2] = 0;
            break;
          case 'i64':
            pa = [
              0,
              ((x = 0),
              1 <= +Math.abs(x)
                ? 0 < x
                  ? (Math.min(+Math.floor(x / 4294967296), 4294967295) | 0) >>>
                    0
                  : ~~+Math.ceil((x - +(~~x >>> 0)) / 4294967296) >>> 0
                : 0),
            ];
            v[b >> 2] = pa[0];
            v[(b + 4) >> 2] = pa[1];
            break;
          case 'float':
            qa[b >> 2] = 0;
            break;
          case 'double':
            ra[b >> 3] = 0;
            break;
          default:
            r('invalid type for setValue: ' + c);
        }
      }
      function sa(b, c) {
        c = c || 'i8';
        '*' === c.charAt(c.length - 1) && (c = 'i32');
        switch (c) {
          case 'i1':
            return u[b >> 0];
          case 'i8':
            return u[b >> 0];
          case 'i16':
            return oa[b >> 1];
          case 'i32':
            return v[b >> 2];
          case 'i64':
            return v[b >> 2];
          case 'float':
            return qa[b >> 2];
          case 'double':
            return Number(ra[b >> 3]);
          default:
            r('invalid type for getValue: ' + c);
        }
        return null;
      }
      var ta,
        ua = !1,
        va =
          'undefined' !== typeof TextDecoder ? new TextDecoder('utf8') : void 0;
      function y(b, c) {
        if (b) {
          var d = z,
            e = b + c;
          for (c = b; d[c] && !(c >= e); ) ++c;
          if (16 < c - b && d.subarray && va) b = va.decode(d.subarray(b, c));
          else {
            for (e = ''; b < c; ) {
              var f = d[b++];
              if (f & 128) {
                var k = d[b++] & 63;
                if (192 == (f & 224))
                  e += String.fromCharCode(((f & 31) << 6) | k);
                else {
                  var p = d[b++] & 63;
                  f =
                    224 == (f & 240)
                      ? ((f & 15) << 12) | (k << 6) | p
                      : ((f & 7) << 18) | (k << 12) | (p << 6) | (d[b++] & 63);
                  65536 > f
                    ? (e += String.fromCharCode(f))
                    : ((f -= 65536),
                      (e += String.fromCharCode(
                        55296 | (f >> 10),
                        56320 | (f & 1023),
                      )));
                }
              } else e += String.fromCharCode(f);
            }
            b = e;
          }
        } else b = '';
        return b;
      }
      function A(b, c, d, e) {
        if (!(0 < e)) return 0;
        var f = d;
        e = d + e - 1;
        for (var k = 0; k < b.length; ++k) {
          var p = b.charCodeAt(k);
          if (55296 <= p && 57343 >= p) {
            var w = b.charCodeAt(++k);
            p = (65536 + ((p & 1023) << 10)) | (w & 1023);
          }
          if (127 >= p) {
            if (d >= e) break;
            c[d++] = p;
          } else {
            if (2047 >= p) {
              if (d + 1 >= e) break;
              c[d++] = 192 | (p >> 6);
            } else {
              if (65535 >= p) {
                if (d + 2 >= e) break;
                c[d++] = 224 | (p >> 12);
              } else {
                if (d + 3 >= e) break;
                c[d++] = 240 | (p >> 18);
                c[d++] = 128 | ((p >> 12) & 63);
              }
              c[d++] = 128 | ((p >> 6) & 63);
            }
            c[d++] = 128 | (p & 63);
          }
        }
        c[d] = 0;
        return d - f;
      }
      function B(b) {
        for (var c = 0, d = 0; d < b.length; ++d) {
          var e = b.charCodeAt(d);
          55296 <= e &&
            57343 >= e &&
            (e = (65536 + ((e & 1023) << 10)) | (b.charCodeAt(++d) & 1023));
          127 >= e ? ++c : (c = 2047 >= e ? c + 2 : 65535 >= e ? c + 3 : c + 4);
        }
        return c;
      }
      function wa(b, c) {
        for (var d = 0; d < b.length; ++d) u[c++ >> 0] = b.charCodeAt(d);
      }
      var xa, u, z, oa, v, qa, ra;
      function ya() {
        var b = ta.buffer;
        xa = b;
        a.HEAP8 = u = new Int8Array(b);
        a.HEAP16 = oa = new Int16Array(b);
        a.HEAP32 = v = new Int32Array(b);
        a.HEAPU8 = z = new Uint8Array(b);
        a.HEAPU16 = new Uint16Array(b);
        a.HEAPU32 = new Uint32Array(b);
        a.HEAPF32 = qa = new Float32Array(b);
        a.HEAPF64 = ra = new Float64Array(b);
      }
      var za,
        Aa = [],
        Ba = [],
        Da = [];
      function Ea() {
        var b = a.preRun.shift();
        Aa.unshift(b);
      }
      var C = 0,
        Fa = null,
        Ga = null;
      a.preloadedImages = {};
      a.preloadedAudios = {};
      function r(b) {
        if (a.onAbort) a.onAbort(b);
        b = 'Aborted(' + b + ')';
        ma(b);
        ua = !0;
        b = new WebAssembly.RuntimeError(
          b + '. Build with -s ASSERTIONS=1 for more info.',
        );
        ba(b);
        throw b;
      }
      function Ha() {
        return D.startsWith('data:application/octet-stream;base64,');
      }
      var D;
      D = 'olm.wasm';
      if (!Ha()) {
        var Ia = D;
        D = a.locateFile ? a.locateFile(Ia, m) : m + Ia;
      }
      function Ja() {
        var b = D;
        try {
          if (b == D && na) return new Uint8Array(na);
          if (la) return la(b);
          throw 'both async and sync fetching of the wasm failed';
        } catch (c) {
          r(c);
        }
      }
      function Ka() {
        if (!na && (ha || ia)) {
          if ('function' === typeof fetch && !D.startsWith('file://'))
            return fetch(D, {credentials: 'same-origin'})
              .then(function (b) {
                if (!b.ok)
                  throw "failed to load wasm binary file at '" + D + "'";
                return b.arrayBuffer();
              })
              .catch(function () {
                return Ja();
              });
          if (ka)
            return new Promise(function (b, c) {
              ka(
                D,
                function (d) {
                  b(new Uint8Array(d));
                },
                c,
              );
            });
        }
        return Promise.resolve().then(function () {
          return Ja();
        });
      }
      var x, pa;
      function La(b) {
        for (; 0 < b.length; ) {
          var c = b.shift();
          if ('function' == typeof c) c(a);
          else {
            var d = c.cc;
            'number' === typeof d
              ? void 0 === c.bc
                ? Ma(d)()
                : Ma(d)(c.bc)
              : d(void 0 === c.bc ? null : c.bc);
          }
        }
      }
      var Na = [];
      function Ma(b) {
        var c = Na[b];
        c || (b >= Na.length && (Na.length = b + 1), (Na[b] = c = za.get(b)));
        return c;
      }
      var Oa = {
        a: function (b, c, d) {
          z.copyWithin(b, c, c + d);
        },
        b: function (b) {
          var c = z.length;
          b >>>= 0;
          if (2147483648 < b) return !1;
          for (var d = 1; 4 >= d; d *= 2) {
            var e = c * (1 + 0.2 / d);
            e = Math.min(e, b + 100663296);
            e = Math.max(b, e);
            0 < e % 65536 && (e += 65536 - (e % 65536));
            a: {
              try {
                ta.grow(
                  (Math.min(2147483648, e) - xa.byteLength + 65535) >>> 16,
                );
                ya();
                var f = 1;
                break a;
              } catch (k) {}
              f = void 0;
            }
            if (f) return !0;
          }
          return !1;
        },
      };
      (function () {
        function b(f) {
          a.asm = f.exports;
          ta = a.asm.c;
          ya();
          za = a.asm.e;
          Ba.unshift(a.asm.d);
          C--;
          a.monitorRunDependencies && a.monitorRunDependencies(C);
          0 == C &&
            (null !== Fa && (clearInterval(Fa), (Fa = null)),
            Ga && ((f = Ga), (Ga = null), f()));
        }
        function c(f) {
          b(f.instance);
        }
        function d(f) {
          return Ka()
            .then(function (k) {
              return WebAssembly.instantiate(k, e);
            })
            .then(function (k) {
              return k;
            })
            .then(f, function (k) {
              ma('failed to asynchronously prepare wasm: ' + k);
              r(k);
            });
        }
        var e = {a: Oa};
        C++;
        a.monitorRunDependencies && a.monitorRunDependencies(C);
        if (a.instantiateWasm)
          try {
            return a.instantiateWasm(e, b);
          } catch (f) {
            return (
              ma('Module.instantiateWasm callback failed with error: ' + f), !1
            );
          }
        (function () {
          return na ||
            'function' !== typeof WebAssembly.instantiateStreaming ||
            Ha() ||
            D.startsWith('file://') ||
            'function' !== typeof fetch
            ? d(c)
            : fetch(D, {credentials: 'same-origin'}).then(function (f) {
                return WebAssembly.instantiateStreaming(f, e).then(
                  c,
                  function (k) {
                    ma('wasm streaming compile failed: ' + k);
                    ma('falling back to ArrayBuffer instantiation');
                    return d(c);
                  },
                );
              });
        })().catch(ba);
        return {};
      })();
      a.___wasm_call_ctors = function () {
        return (a.___wasm_call_ctors = a.asm.d).apply(null, arguments);
      };
      a._olm_get_library_version = function () {
        return (a._olm_get_library_version = a.asm.f).apply(null, arguments);
      };
      a._olm_error = function () {
        return (a._olm_error = a.asm.g).apply(null, arguments);
      };
      a._olm_account_last_error = function () {
        return (a._olm_account_last_error = a.asm.h).apply(null, arguments);
      };
      a.__olm_error_to_string = function () {
        return (a.__olm_error_to_string = a.asm.i).apply(null, arguments);
      };
      a._olm_account_last_error_code = function () {
        return (a._olm_account_last_error_code = a.asm.j).apply(
          null,
          arguments,
        );
      };
      a._olm_session_last_error = function () {
        return (a._olm_session_last_error = a.asm.k).apply(null, arguments);
      };
      a._olm_session_last_error_code = function () {
        return (a._olm_session_last_error_code = a.asm.l).apply(
          null,
          arguments,
        );
      };
      a._olm_utility_last_error = function () {
        return (a._olm_utility_last_error = a.asm.m).apply(null, arguments);
      };
      a._olm_utility_last_error_code = function () {
        return (a._olm_utility_last_error_code = a.asm.n).apply(
          null,
          arguments,
        );
      };
      a._olm_account_size = function () {
        return (a._olm_account_size = a.asm.o).apply(null, arguments);
      };
      a._olm_session_size = function () {
        return (a._olm_session_size = a.asm.p).apply(null, arguments);
      };
      a._olm_utility_size = function () {
        return (a._olm_utility_size = a.asm.q).apply(null, arguments);
      };
      a._olm_account = function () {
        return (a._olm_account = a.asm.r).apply(null, arguments);
      };
      a._olm_session = function () {
        return (a._olm_session = a.asm.s).apply(null, arguments);
      };
      a._olm_utility = function () {
        return (a._olm_utility = a.asm.t).apply(null, arguments);
      };
      a._olm_clear_account = function () {
        return (a._olm_clear_account = a.asm.u).apply(null, arguments);
      };
      a._olm_clear_session = function () {
        return (a._olm_clear_session = a.asm.v).apply(null, arguments);
      };
      a._olm_clear_utility = function () {
        return (a._olm_clear_utility = a.asm.w).apply(null, arguments);
      };
      a._olm_pickle_account_length = function () {
        return (a._olm_pickle_account_length = a.asm.x).apply(null, arguments);
      };
      a._olm_pickle_session_length = function () {
        return (a._olm_pickle_session_length = a.asm.y).apply(null, arguments);
      };
      a._olm_pickle_account = function () {
        return (a._olm_pickle_account = a.asm.z).apply(null, arguments);
      };
      a._olm_pickle_session = function () {
        return (a._olm_pickle_session = a.asm.A).apply(null, arguments);
      };
      a._olm_unpickle_account = function () {
        return (a._olm_unpickle_account = a.asm.B).apply(null, arguments);
      };
      a._olm_unpickle_session = function () {
        return (a._olm_unpickle_session = a.asm.C).apply(null, arguments);
      };
      a._olm_create_account_random_length = function () {
        return (a._olm_create_account_random_length = a.asm.D).apply(
          null,
          arguments,
        );
      };
      a._olm_create_account = function () {
        return (a._olm_create_account = a.asm.E).apply(null, arguments);
      };
      a._olm_account_identity_keys_length = function () {
        return (a._olm_account_identity_keys_length = a.asm.F).apply(
          null,
          arguments,
        );
      };
      a._olm_account_identity_keys = function () {
        return (a._olm_account_identity_keys = a.asm.G).apply(null, arguments);
      };
      a._olm_account_signature_length = function () {
        return (a._olm_account_signature_length = a.asm.H).apply(
          null,
          arguments,
        );
      };
      a._olm_account_sign = function () {
        return (a._olm_account_sign = a.asm.I).apply(null, arguments);
      };
      a._olm_account_one_time_keys_length = function () {
        return (a._olm_account_one_time_keys_length = a.asm.J).apply(
          null,
          arguments,
        );
      };
      a._olm_account_one_time_keys = function () {
        return (a._olm_account_one_time_keys = a.asm.K).apply(null, arguments);
      };
      a._olm_account_mark_keys_as_published = function () {
        return (a._olm_account_mark_keys_as_published = a.asm.L).apply(
          null,
          arguments,
        );
      };
      a._olm_account_max_number_of_one_time_keys = function () {
        return (a._olm_account_max_number_of_one_time_keys = a.asm.M).apply(
          null,
          arguments,
        );
      };
      a._olm_account_generate_one_time_keys_random_length = function () {
        return (a._olm_account_generate_one_time_keys_random_length =
          a.asm.N).apply(null, arguments);
      };
      a._olm_account_generate_one_time_keys = function () {
        return (a._olm_account_generate_one_time_keys = a.asm.O).apply(
          null,
          arguments,
        );
      };
      a._olm_account_generate_fallback_key_random_length = function () {
        return (a._olm_account_generate_fallback_key_random_length =
          a.asm.P).apply(null, arguments);
      };
      a._olm_account_generate_fallback_key = function () {
        return (a._olm_account_generate_fallback_key = a.asm.Q).apply(
          null,
          arguments,
        );
      };
      a._olm_account_fallback_key_length = function () {
        return (a._olm_account_fallback_key_length = a.asm.R).apply(
          null,
          arguments,
        );
      };
      a._olm_account_fallback_key = function () {
        return (a._olm_account_fallback_key = a.asm.S).apply(null, arguments);
      };
      a._olm_account_unpublished_fallback_key_length = function () {
        return (a._olm_account_unpublished_fallback_key_length = a.asm.T).apply(
          null,
          arguments,
        );
      };
      a._olm_account_unpublished_fallback_key = function () {
        return (a._olm_account_unpublished_fallback_key = a.asm.U).apply(
          null,
          arguments,
        );
      };
      a._olm_account_forget_old_fallback_key = function () {
        return (a._olm_account_forget_old_fallback_key = a.asm.V).apply(
          null,
          arguments,
        );
      };
      a._olm_create_outbound_session_random_length = function () {
        return (a._olm_create_outbound_session_random_length = a.asm.W).apply(
          null,
          arguments,
        );
      };
      a._olm_create_outbound_session = function () {
        return (a._olm_create_outbound_session = a.asm.X).apply(
          null,
          arguments,
        );
      };
      a._olm_create_inbound_session = function () {
        return (a._olm_create_inbound_session = a.asm.Y).apply(null, arguments);
      };
      a._olm_create_inbound_session_from = function () {
        return (a._olm_create_inbound_session_from = a.asm.Z).apply(
          null,
          arguments,
        );
      };
      a._olm_session_id_length = function () {
        return (a._olm_session_id_length = a.asm._).apply(null, arguments);
      };
      a._olm_session_id = function () {
        return (a._olm_session_id = a.asm.$).apply(null, arguments);
      };
      a._olm_session_has_received_message = function () {
        return (a._olm_session_has_received_message = a.asm.aa).apply(
          null,
          arguments,
        );
      };
      a._olm_session_describe = function () {
        return (a._olm_session_describe = a.asm.ba).apply(null, arguments);
      };
      a._olm_matches_inbound_session = function () {
        return (a._olm_matches_inbound_session = a.asm.ca).apply(
          null,
          arguments,
        );
      };
      a._olm_matches_inbound_session_from = function () {
        return (a._olm_matches_inbound_session_from = a.asm.da).apply(
          null,
          arguments,
        );
      };
      a._olm_remove_one_time_keys = function () {
        return (a._olm_remove_one_time_keys = a.asm.ea).apply(null, arguments);
      };
      a._olm_encrypt_message_type = function () {
        return (a._olm_encrypt_message_type = a.asm.fa).apply(null, arguments);
      };
      a._olm_encrypt_random_length = function () {
        return (a._olm_encrypt_random_length = a.asm.ga).apply(null, arguments);
      };
      a._olm_encrypt_message_length = function () {
        return (a._olm_encrypt_message_length = a.asm.ha).apply(
          null,
          arguments,
        );
      };
      a._olm_encrypt = function () {
        return (a._olm_encrypt = a.asm.ia).apply(null, arguments);
      };
      a._olm_decrypt_max_plaintext_length = function () {
        return (a._olm_decrypt_max_plaintext_length = a.asm.ja).apply(
          null,
          arguments,
        );
      };
      a._olm_decrypt = function () {
        return (a._olm_decrypt = a.asm.ka).apply(null, arguments);
      };
      a._olm_sha256_length = function () {
        return (a._olm_sha256_length = a.asm.la).apply(null, arguments);
      };
      a._olm_sha256 = function () {
        return (a._olm_sha256 = a.asm.ma).apply(null, arguments);
      };
      a._olm_ed25519_verify = function () {
        return (a._olm_ed25519_verify = a.asm.na).apply(null, arguments);
      };
      a._olm_pk_encryption_last_error = function () {
        return (a._olm_pk_encryption_last_error = a.asm.oa).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_encryption_last_error_code = function () {
        return (a._olm_pk_encryption_last_error_code = a.asm.pa).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_encryption_size = function () {
        return (a._olm_pk_encryption_size = a.asm.qa).apply(null, arguments);
      };
      a._olm_pk_encryption = function () {
        return (a._olm_pk_encryption = a.asm.ra).apply(null, arguments);
      };
      a._olm_clear_pk_encryption = function () {
        return (a._olm_clear_pk_encryption = a.asm.sa).apply(null, arguments);
      };
      a._olm_pk_encryption_set_recipient_key = function () {
        return (a._olm_pk_encryption_set_recipient_key = a.asm.ta).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_key_length = function () {
        return (a._olm_pk_key_length = a.asm.ua).apply(null, arguments);
      };
      a._olm_pk_ciphertext_length = function () {
        return (a._olm_pk_ciphertext_length = a.asm.va).apply(null, arguments);
      };
      a._olm_pk_mac_length = function () {
        return (a._olm_pk_mac_length = a.asm.wa).apply(null, arguments);
      };
      a._olm_pk_encrypt_random_length = function () {
        return (a._olm_pk_encrypt_random_length = a.asm.xa).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_encrypt = function () {
        return (a._olm_pk_encrypt = a.asm.ya).apply(null, arguments);
      };
      a._olm_pk_decryption_last_error = function () {
        return (a._olm_pk_decryption_last_error = a.asm.za).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_decryption_last_error_code = function () {
        return (a._olm_pk_decryption_last_error_code = a.asm.Aa).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_decryption_size = function () {
        return (a._olm_pk_decryption_size = a.asm.Ba).apply(null, arguments);
      };
      a._olm_pk_decryption = function () {
        return (a._olm_pk_decryption = a.asm.Ca).apply(null, arguments);
      };
      a._olm_clear_pk_decryption = function () {
        return (a._olm_clear_pk_decryption = a.asm.Da).apply(null, arguments);
      };
      a._olm_pk_private_key_length = function () {
        return (a._olm_pk_private_key_length = a.asm.Ea).apply(null, arguments);
      };
      a._olm_pk_generate_key_random_length = function () {
        return (a._olm_pk_generate_key_random_length = a.asm.Fa).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_key_from_private = function () {
        return (a._olm_pk_key_from_private = a.asm.Ga).apply(null, arguments);
      };
      a._olm_pk_generate_key = function () {
        return (a._olm_pk_generate_key = a.asm.Ha).apply(null, arguments);
      };
      a._olm_pickle_pk_decryption_length = function () {
        return (a._olm_pickle_pk_decryption_length = a.asm.Ia).apply(
          null,
          arguments,
        );
      };
      a._olm_pickle_pk_decryption = function () {
        return (a._olm_pickle_pk_decryption = a.asm.Ja).apply(null, arguments);
      };
      a._olm_unpickle_pk_decryption = function () {
        return (a._olm_unpickle_pk_decryption = a.asm.Ka).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_max_plaintext_length = function () {
        return (a._olm_pk_max_plaintext_length = a.asm.La).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_decrypt = function () {
        return (a._olm_pk_decrypt = a.asm.Ma).apply(null, arguments);
      };
      a._olm_pk_get_private_key = function () {
        return (a._olm_pk_get_private_key = a.asm.Na).apply(null, arguments);
      };
      a._olm_pk_signing_size = function () {
        return (a._olm_pk_signing_size = a.asm.Oa).apply(null, arguments);
      };
      a._olm_pk_signing = function () {
        return (a._olm_pk_signing = a.asm.Pa).apply(null, arguments);
      };
      a._olm_pk_signing_last_error = function () {
        return (a._olm_pk_signing_last_error = a.asm.Qa).apply(null, arguments);
      };
      a._olm_pk_signing_last_error_code = function () {
        return (a._olm_pk_signing_last_error_code = a.asm.Ra).apply(
          null,
          arguments,
        );
      };
      a._olm_clear_pk_signing = function () {
        return (a._olm_clear_pk_signing = a.asm.Sa).apply(null, arguments);
      };
      a._olm_pk_signing_seed_length = function () {
        return (a._olm_pk_signing_seed_length = a.asm.Ta).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_signing_public_key_length = function () {
        return (a._olm_pk_signing_public_key_length = a.asm.Ua).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_signing_key_from_seed = function () {
        return (a._olm_pk_signing_key_from_seed = a.asm.Va).apply(
          null,
          arguments,
        );
      };
      a._olm_pk_signature_length = function () {
        return (a._olm_pk_signature_length = a.asm.Wa).apply(null, arguments);
      };
      a._olm_pk_sign = function () {
        return (a._olm_pk_sign = a.asm.Xa).apply(null, arguments);
      };
      a._olm_inbound_group_session_size = function () {
        return (a._olm_inbound_group_session_size = a.asm.Ya).apply(
          null,
          arguments,
        );
      };
      a._olm_inbound_group_session = function () {
        return (a._olm_inbound_group_session = a.asm.Za).apply(null, arguments);
      };
      a._olm_clear_inbound_group_session = function () {
        return (a._olm_clear_inbound_group_session = a.asm._a).apply(
          null,
          arguments,
        );
      };
      a._olm_inbound_group_session_last_error = function () {
        return (a._olm_inbound_group_session_last_error = a.asm.$a).apply(
          null,
          arguments,
        );
      };
      a._olm_inbound_group_session_last_error_code = function () {
        return (a._olm_inbound_group_session_last_error_code = a.asm.ab).apply(
          null,
          arguments,
        );
      };
      a._olm_init_inbound_group_session = function () {
        return (a._olm_init_inbound_group_session = a.asm.bb).apply(
          null,
          arguments,
        );
      };
      a._olm_import_inbound_group_session = function () {
        return (a._olm_import_inbound_group_session = a.asm.cb).apply(
          null,
          arguments,
        );
      };
      a._olm_pickle_inbound_group_session_length = function () {
        return (a._olm_pickle_inbound_group_session_length = a.asm.db).apply(
          null,
          arguments,
        );
      };
      a._olm_pickle_inbound_group_session = function () {
        return (a._olm_pickle_inbound_group_session = a.asm.eb).apply(
          null,
          arguments,
        );
      };
      a._olm_unpickle_inbound_group_session = function () {
        return (a._olm_unpickle_inbound_group_session = a.asm.fb).apply(
          null,
          arguments,
        );
      };
      a._olm_group_decrypt_max_plaintext_length = function () {
        return (a._olm_group_decrypt_max_plaintext_length = a.asm.gb).apply(
          null,
          arguments,
        );
      };
      a._olm_group_decrypt = function () {
        return (a._olm_group_decrypt = a.asm.hb).apply(null, arguments);
      };
      a._olm_inbound_group_session_id_length = function () {
        return (a._olm_inbound_group_session_id_length = a.asm.ib).apply(
          null,
          arguments,
        );
      };
      a._olm_inbound_group_session_id = function () {
        return (a._olm_inbound_group_session_id = a.asm.jb).apply(
          null,
          arguments,
        );
      };
      a._olm_inbound_group_session_first_known_index = function () {
        return (a._olm_inbound_group_session_first_known_index =
          a.asm.kb).apply(null, arguments);
      };
      a._olm_inbound_group_session_is_verified = function () {
        return (a._olm_inbound_group_session_is_verified = a.asm.lb).apply(
          null,
          arguments,
        );
      };
      a._olm_export_inbound_group_session_length = function () {
        return (a._olm_export_inbound_group_session_length = a.asm.mb).apply(
          null,
          arguments,
        );
      };
      a._olm_export_inbound_group_session = function () {
        return (a._olm_export_inbound_group_session = a.asm.nb).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_size = function () {
        return (a._olm_outbound_group_session_size = a.asm.ob).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session = function () {
        return (a._olm_outbound_group_session = a.asm.pb).apply(
          null,
          arguments,
        );
      };
      a._olm_clear_outbound_group_session = function () {
        return (a._olm_clear_outbound_group_session = a.asm.qb).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_last_error = function () {
        return (a._olm_outbound_group_session_last_error = a.asm.rb).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_last_error_code = function () {
        return (a._olm_outbound_group_session_last_error_code = a.asm.sb).apply(
          null,
          arguments,
        );
      };
      a._olm_pickle_outbound_group_session_length = function () {
        return (a._olm_pickle_outbound_group_session_length = a.asm.tb).apply(
          null,
          arguments,
        );
      };
      a._olm_pickle_outbound_group_session = function () {
        return (a._olm_pickle_outbound_group_session = a.asm.ub).apply(
          null,
          arguments,
        );
      };
      a._olm_unpickle_outbound_group_session = function () {
        return (a._olm_unpickle_outbound_group_session = a.asm.vb).apply(
          null,
          arguments,
        );
      };
      a._olm_init_outbound_group_session_random_length = function () {
        return (a._olm_init_outbound_group_session_random_length =
          a.asm.wb).apply(null, arguments);
      };
      a._olm_init_outbound_group_session = function () {
        return (a._olm_init_outbound_group_session = a.asm.xb).apply(
          null,
          arguments,
        );
      };
      a._olm_group_encrypt_message_length = function () {
        return (a._olm_group_encrypt_message_length = a.asm.yb).apply(
          null,
          arguments,
        );
      };
      a._olm_group_encrypt = function () {
        return (a._olm_group_encrypt = a.asm.zb).apply(null, arguments);
      };
      a._olm_outbound_group_session_id_length = function () {
        return (a._olm_outbound_group_session_id_length = a.asm.Ab).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_id = function () {
        return (a._olm_outbound_group_session_id = a.asm.Bb).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_message_index = function () {
        return (a._olm_outbound_group_session_message_index = a.asm.Cb).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_key_length = function () {
        return (a._olm_outbound_group_session_key_length = a.asm.Db).apply(
          null,
          arguments,
        );
      };
      a._olm_outbound_group_session_key = function () {
        return (a._olm_outbound_group_session_key = a.asm.Eb).apply(
          null,
          arguments,
        );
      };
      a._olm_sas_last_error = function () {
        return (a._olm_sas_last_error = a.asm.Fb).apply(null, arguments);
      };
      a._olm_sas_last_error_code = function () {
        return (a._olm_sas_last_error_code = a.asm.Gb).apply(null, arguments);
      };
      a._olm_sas_size = function () {
        return (a._olm_sas_size = a.asm.Hb).apply(null, arguments);
      };
      a._olm_sas = function () {
        return (a._olm_sas = a.asm.Ib).apply(null, arguments);
      };
      a._olm_clear_sas = function () {
        return (a._olm_clear_sas = a.asm.Jb).apply(null, arguments);
      };
      a._olm_create_sas_random_length = function () {
        return (a._olm_create_sas_random_length = a.asm.Kb).apply(
          null,
          arguments,
        );
      };
      a._olm_create_sas = function () {
        return (a._olm_create_sas = a.asm.Lb).apply(null, arguments);
      };
      a._olm_sas_pubkey_length = function () {
        return (a._olm_sas_pubkey_length = a.asm.Mb).apply(null, arguments);
      };
      a._olm_sas_get_pubkey = function () {
        return (a._olm_sas_get_pubkey = a.asm.Nb).apply(null, arguments);
      };
      a._olm_sas_set_their_key = function () {
        return (a._olm_sas_set_their_key = a.asm.Ob).apply(null, arguments);
      };
      a._olm_sas_is_their_key_set = function () {
        return (a._olm_sas_is_their_key_set = a.asm.Pb).apply(null, arguments);
      };
      a._olm_sas_generate_bytes = function () {
        return (a._olm_sas_generate_bytes = a.asm.Qb).apply(null, arguments);
      };
      a._olm_sas_mac_length = function () {
        return (a._olm_sas_mac_length = a.asm.Rb).apply(null, arguments);
      };
      a._olm_sas_calculate_mac_fixed_base64 = function () {
        return (a._olm_sas_calculate_mac_fixed_base64 = a.asm.Sb).apply(
          null,
          arguments,
        );
      };
      a._olm_sas_calculate_mac = function () {
        return (a._olm_sas_calculate_mac = a.asm.Tb).apply(null, arguments);
      };
      a._olm_sas_calculate_mac_long_kdf = function () {
        return (a._olm_sas_calculate_mac_long_kdf = a.asm.Ub).apply(
          null,
          arguments,
        );
      };
      a._malloc = function () {
        return (a._malloc = a.asm.Vb).apply(null, arguments);
      };
      a._free = function () {
        return (a._free = a.asm.Wb).apply(null, arguments);
      };
      var Pa = (a.stackSave = function () {
          return (Pa = a.stackSave = a.asm.Xb).apply(null, arguments);
        }),
        Qa = (a.stackRestore = function () {
          return (Qa = a.stackRestore = a.asm.Yb).apply(null, arguments);
        }),
        Ra = (a.stackAlloc = function () {
          return (Ra = a.stackAlloc = a.asm.Zb).apply(null, arguments);
        });
      a.ALLOC_STACK = 1;
      var Sa;
      Ga = function Ta() {
        Sa || Ua();
        Sa || (Ga = Ta);
      };
      function Ua() {
        function b() {
          if (!Sa && ((Sa = !0), (a.calledRun = !0), !ua)) {
            La(Ba);
            aa(a);
            if (a.onRuntimeInitialized) a.onRuntimeInitialized();
            if (a.postRun)
              for (
                'function' == typeof a.postRun && (a.postRun = [a.postRun]);
                a.postRun.length;

              ) {
                var c = a.postRun.shift();
                Da.unshift(c);
              }
            La(Da);
          }
        }
        if (!(0 < C)) {
          if (a.preRun)
            for (
              'function' == typeof a.preRun && (a.preRun = [a.preRun]);
              a.preRun.length;

            )
              Ea();
          La(Aa);
          0 < C ||
            (a.setStatus
              ? (a.setStatus('Running...'),
                setTimeout(function () {
                  setTimeout(function () {
                    a.setStatus('');
                  }, 1);
                  b();
                }, 1))
              : b());
        }
      }
      a.run = Ua;
      if (a.preInit)
        for (
          'function' == typeof a.preInit && (a.preInit = [a.preInit]);
          0 < a.preInit.length;

        )
          a.preInit.pop()();
      Ua();
      function E() {
        var b = a._olm_outbound_group_session_size();
        this.ac = F(b);
        this.$b = a._olm_outbound_group_session(this.ac);
      }
      function G(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_outbound_group_session_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      E.prototype.free = function () {
        a._olm_clear_outbound_group_session(this.$b);
        H(this.$b);
      };
      E.prototype.pickle = J(function (b) {
        b = K(b);
        var c = G(a._olm_pickle_outbound_group_session_length)(this.$b),
          d = L(b),
          e = L(c + 1);
        try {
          G(a._olm_pickle_outbound_group_session)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      E.prototype.unpickle = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c);
        try {
          G(a._olm_unpickle_outbound_group_session)(
            this.$b,
            d,
            b.length,
            e,
            c.length,
          );
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
      });
      E.prototype.create = J(function () {
        var b = G(a._olm_init_outbound_group_session_random_length)(this.$b),
          c = N(b, g);
        try {
          G(a._olm_init_outbound_group_session)(this.$b, c, b);
        } finally {
          M(c, b);
        }
      });
      E.prototype.encrypt = function (b) {
        try {
          var c = B(b);
          var d = G(a._olm_group_encrypt_message_length)(this.$b, c);
          var e = F(c + 1);
          A(b, z, e, c + 1);
          var f = F(d + 1);
          G(a._olm_group_encrypt)(this.$b, e, c, f, d);
          t(f + d);
          return y(f, d);
        } finally {
          void 0 !== e && (M(e, c + 1), H(e)), void 0 !== f && H(f);
        }
      };
      E.prototype.session_id = J(function () {
        var b = G(a._olm_outbound_group_session_id_length)(this.$b),
          c = L(b + 1);
        G(a._olm_outbound_group_session_id)(this.$b, c, b);
        return y(c, b);
      });
      E.prototype.session_key = J(function () {
        var b = G(a._olm_outbound_group_session_key_length)(this.$b),
          c = L(b + 1);
        G(a._olm_outbound_group_session_key)(this.$b, c, b);
        var d = y(c, b);
        M(c, b);
        return d;
      });
      E.prototype.message_index = function () {
        return G(a._olm_outbound_group_session_message_index)(this.$b);
      };
      olm_exports.OutboundGroupSession = E;
      function O() {
        var b = a._olm_inbound_group_session_size();
        this.ac = F(b);
        this.$b = a._olm_inbound_group_session(this.ac);
      }
      function P(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_inbound_group_session_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      O.prototype.free = function () {
        a._olm_clear_inbound_group_session(this.$b);
        H(this.$b);
      };
      O.prototype.pickle = J(function (b) {
        b = K(b);
        var c = P(a._olm_pickle_inbound_group_session_length)(this.$b),
          d = L(b),
          e = L(c + 1);
        try {
          P(a._olm_pickle_inbound_group_session)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      O.prototype.unpickle = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c);
        try {
          P(a._olm_unpickle_inbound_group_session)(
            this.$b,
            d,
            b.length,
            e,
            c.length,
          );
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
      });
      O.prototype.create = J(function (b) {
        b = K(b);
        var c = L(b);
        try {
          P(a._olm_init_inbound_group_session)(this.$b, c, b.length);
        } finally {
          for (M(c, b.length), c = 0; c < b.length; c++) b[c] = 0;
        }
      });
      O.prototype.import_session = J(function (b) {
        b = K(b);
        var c = L(b);
        try {
          P(a._olm_import_inbound_group_session)(this.$b, c, b.length);
        } finally {
          for (M(c, b.length), c = 0; c < b.length; c++) b[c] = 0;
        }
      });
      O.prototype.decrypt = J(function (b) {
        try {
          var c = F(b.length);
          wa(b, c);
          var d = P(a._olm_group_decrypt_max_plaintext_length)(
            this.$b,
            c,
            b.length,
          );
          wa(b, c);
          var e = F(d + 1);
          var f = L(4);
          var k = P(a._olm_group_decrypt)(this.$b, c, b.length, e, d, f);
          t(e + k);
          return {plaintext: y(e, k), message_index: sa(f, 'i32')};
        } finally {
          void 0 !== c && H(c), void 0 !== e && (M(e, k), H(e));
        }
      });
      O.prototype.session_id = J(function () {
        var b = P(a._olm_inbound_group_session_id_length)(this.$b),
          c = L(b + 1);
        P(a._olm_inbound_group_session_id)(this.$b, c, b);
        return y(c, b);
      });
      O.prototype.first_known_index = J(function () {
        return P(a._olm_inbound_group_session_first_known_index)(this.$b);
      });
      O.prototype.export_session = J(function (b) {
        var c = P(a._olm_export_inbound_group_session_length)(this.$b),
          d = L(c + 1);
        G(a._olm_export_inbound_group_session)(this.$b, d, c, b);
        b = y(d, c);
        M(d, c);
        return b;
      });
      olm_exports.InboundGroupSession = O;
      function Va() {
        var b = a._olm_pk_encryption_size();
        this.ac = F(b);
        this.$b = a._olm_pk_encryption(this.ac);
      }
      function Q(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_pk_encryption_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      Va.prototype.free = function () {
        a._olm_clear_pk_encryption(this.$b);
        H(this.$b);
      };
      Va.prototype.set_recipient_key = J(function (b) {
        b = K(b);
        var c = L(b);
        Q(a._olm_pk_encryption_set_recipient_key)(this.$b, c, b.length);
      });
      Va.prototype.encrypt = J(function (b) {
        try {
          var c = B(b);
          var d = F(c + 1);
          A(b, z, d, c + 1);
          var e = Q(a._olm_pk_encrypt_random_length)();
          var f = N(e, g);
          var k = Q(a._olm_pk_ciphertext_length)(this.$b, c);
          var p = F(k + 1);
          var w = Q(a._olm_pk_mac_length)(this.$b),
            fa = L(w + 1);
          t(fa + w);
          var R = Q(a._olm_pk_key_length)(),
            I = L(R + 1);
          t(I + R);
          Q(a._olm_pk_encrypt)(this.$b, d, c, p, k, fa, w, I, R, f, e);
          t(p + k);
          return {ciphertext: y(p, k), mac: y(fa, w), ephemeral: y(I, R)};
        } finally {
          void 0 !== f && M(f, e),
            void 0 !== d && (M(d, c + 1), H(d)),
            void 0 !== p && H(p);
        }
      });
      function S() {
        var b = a._olm_pk_decryption_size();
        this.ac = F(b);
        this.$b = a._olm_pk_decryption(this.ac);
      }
      function T(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_pk_decryption_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      S.prototype.free = function () {
        a._olm_clear_pk_decryption(this.$b);
        H(this.$b);
      };
      S.prototype.init_with_private_key = J(function (b) {
        var c = L(b.length);
        a.HEAPU8.set(b, c);
        var d = T(a._olm_pk_key_length)(),
          e = L(d + 1);
        try {
          T(a._olm_pk_key_from_private)(this.$b, e, d, c, b.length);
        } finally {
          M(c, b.length);
        }
        return y(e, d);
      });
      S.prototype.generate_key = J(function () {
        var b = T(a._olm_pk_private_key_length)(),
          c = N(b, g),
          d = T(a._olm_pk_key_length)(),
          e = L(d + 1);
        try {
          T(a._olm_pk_key_from_private)(this.$b, e, d, c, b);
        } finally {
          M(c, b);
        }
        return y(e, d);
      });
      S.prototype.get_private_key = J(function () {
        var b = Q(a._olm_pk_private_key_length)(),
          c = L(b);
        T(a._olm_pk_get_private_key)(this.$b, c, b);
        var d = new Uint8Array(new Uint8Array(a.HEAPU8.buffer, c, b));
        M(c, b);
        return d;
      });
      S.prototype.pickle = J(function (b) {
        b = K(b);
        var c = T(a._olm_pickle_pk_decryption_length)(this.$b),
          d = L(b),
          e = L(c + 1);
        try {
          T(a._olm_pickle_pk_decryption)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      S.prototype.unpickle = J(function (b, c) {
        b = K(b);
        var d = L(b),
          e = K(c),
          f = L(e);
        c = T(a._olm_pk_key_length)();
        var k = L(c + 1);
        try {
          T(a._olm_unpickle_pk_decryption)(
            this.$b,
            d,
            b.length,
            f,
            e.length,
            k,
            c,
          );
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(k, c);
      });
      S.prototype.decrypt = J(function (b, c, d) {
        try {
          var e = B(d);
          var f = F(e + 1);
          A(d, z, f, e + 1);
          var k = K(b),
            p = L(k),
            w = K(c),
            fa = L(w);
          var R = T(a._olm_pk_max_plaintext_length)(this.$b, e);
          var I = F(R + 1);
          var Ca = T(a._olm_pk_decrypt)(
            this.$b,
            p,
            k.length,
            fa,
            w.length,
            f,
            e,
            I,
            R,
          );
          t(I + Ca);
          return y(I, Ca);
        } finally {
          void 0 !== I && (M(I, Ca + 1), H(I)), void 0 !== f && H(f);
        }
      });
      function Wa() {
        var b = a._olm_pk_signing_size();
        this.ac = F(b);
        this.$b = a._olm_pk_signing(this.ac);
      }
      function Xa(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_pk_signing_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      Wa.prototype.free = function () {
        a._olm_clear_pk_signing(this.$b);
        H(this.$b);
      };
      Wa.prototype.init_with_seed = J(function (b) {
        var c = L(b.length);
        a.HEAPU8.set(b, c);
        var d = Xa(a._olm_pk_signing_public_key_length)(),
          e = L(d + 1);
        try {
          Xa(a._olm_pk_signing_key_from_seed)(this.$b, e, d, c, b.length);
        } finally {
          M(c, b.length);
        }
        return y(e, d);
      });
      Wa.prototype.generate_seed = J(function () {
        var b = Xa(a._olm_pk_signing_seed_length)(),
          c = N(b, g),
          d = new Uint8Array(new Uint8Array(a.HEAPU8.buffer, c, b));
        M(c, b);
        return d;
      });
      Wa.prototype.sign = J(function (b) {
        try {
          var c = B(b);
          var d = F(c + 1);
          A(b, z, d, c + 1);
          var e = Xa(a._olm_pk_signature_length)(),
            f = L(e + 1);
          Xa(a._olm_pk_sign)(this.$b, d, c, f, e);
          return y(f, e);
        } finally {
          void 0 !== d && (M(d, c + 1), H(d));
        }
      });
      function U() {
        var b = a._olm_sas_size(),
          c = a._olm_create_sas_random_length(),
          d = N(c, g);
        this.ac = F(b);
        this.$b = a._olm_sas(this.ac);
        a._olm_create_sas(this.$b, d, c);
        M(d, c);
      }
      function V(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_sas_last_error(arguments[0]))), Error('OLM.' + c))
            );
          return c;
        };
      }
      U.prototype.free = function () {
        a._olm_clear_sas(this.$b);
        H(this.$b);
      };
      U.prototype.get_pubkey = J(function () {
        var b = V(a._olm_sas_pubkey_length)(this.$b),
          c = L(b + 1);
        V(a._olm_sas_get_pubkey)(this.$b, c, b);
        return y(c, b);
      });
      U.prototype.set_their_key = J(function (b) {
        b = K(b);
        var c = L(b);
        V(a._olm_sas_set_their_key)(this.$b, c, b.length);
      });
      U.prototype.is_their_key_set = J(function () {
        return V(a._olm_sas_is_their_key_set)(this.$b) ? !0 : !1;
      });
      U.prototype.generate_bytes = J(function (b, c) {
        b = K(b);
        var d = L(b),
          e = L(c);
        V(a._olm_sas_generate_bytes)(this.$b, d, b.length, e, c);
        return new Uint8Array(new Uint8Array(a.HEAPU8.buffer, e, c));
      });
      U.prototype.calculate_mac = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c),
          f = V(a._olm_sas_mac_length)(this.$b),
          k = L(f + 1);
        V(a._olm_sas_calculate_mac)(this.$b, d, b.length, e, c.length, k, f);
        return y(k, f);
      });
      U.prototype.calculate_mac_fixed_base64 = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c),
          f = V(a._olm_sas_mac_length)(this.$b),
          k = L(f + 1);
        V(a._olm_sas_calculate_mac_fixed_base64)(
          this.$b,
          d,
          b.length,
          e,
          c.length,
          k,
          f,
        );
        return y(k, f);
      });
      U.prototype.calculate_mac_long_kdf = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c),
          f = V(a._olm_sas_mac_length)(this.$b),
          k = L(f + 1);
        V(a._olm_sas_calculate_mac_long_kdf)(
          this.$b,
          d,
          b.length,
          e,
          c.length,
          k,
          f,
        );
        return y(k, f);
      });
      var F = a._malloc,
        H = a._free,
        h;
      function N(b, c) {
        var d = Ra(b);
        c(new Uint8Array(a.HEAPU8.buffer, d, b));
        return d;
      }
      function L(b) {
        return 'number' == typeof b
          ? N(b, function (c) {
              c.fill(0);
            })
          : N(b.length, function (c) {
              c.set(b);
            });
      }
      function K(b) {
        if (b instanceof Uint8Array) var c = b;
        else (c = Array(B(b) + 1)), (b = A(b, c, 0, c.length)), (c.length = b);
        return c;
      }
      function J(b) {
        return function () {
          var c = Pa();
          try {
            return b.apply(this, arguments);
          } finally {
            Qa(c);
          }
        };
      }
      function M(b, c) {
        for (; 0 < c--; ) a.HEAP8[b++] = 0;
      }
      function W() {
        var b = a._olm_account_size();
        this.ac = F(b);
        this.$b = a._olm_account(this.ac);
      }
      function X(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_account_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      W.prototype.free = function () {
        a._olm_clear_account(this.$b);
        H(this.$b);
      };
      W.prototype.create = J(function () {
        var b = X(a._olm_create_account_random_length)(this.$b),
          c = N(b, g);
        try {
          X(a._olm_create_account)(this.$b, c, b);
        } finally {
          M(c, b);
        }
      });
      W.prototype.identity_keys = J(function () {
        var b = X(a._olm_account_identity_keys_length)(this.$b),
          c = L(b + 1);
        X(a._olm_account_identity_keys)(this.$b, c, b);
        return y(c, b);
      });
      W.prototype.sign = J(function (b) {
        var c = X(a._olm_account_signature_length)(this.$b);
        b = K(b);
        var d = L(b),
          e = L(c + 1);
        try {
          X(a._olm_account_sign)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      W.prototype.one_time_keys = J(function () {
        var b = X(a._olm_account_one_time_keys_length)(this.$b),
          c = L(b + 1);
        X(a._olm_account_one_time_keys)(this.$b, c, b);
        return y(c, b);
      });
      W.prototype.mark_keys_as_published = J(function () {
        X(a._olm_account_mark_keys_as_published)(this.$b);
      });
      W.prototype.max_number_of_one_time_keys = J(function () {
        return X(a._olm_account_max_number_of_one_time_keys)(this.$b);
      });
      W.prototype.generate_one_time_keys = J(function (b) {
        var c = X(a._olm_account_generate_one_time_keys_random_length)(
            this.$b,
            b,
          ),
          d = N(c, g);
        try {
          X(a._olm_account_generate_one_time_keys)(this.$b, b, d, c);
        } finally {
          M(d, c);
        }
      });
      W.prototype.remove_one_time_keys = J(function (b) {
        X(a._olm_remove_one_time_keys)(this.$b, b.$b);
      });
      W.prototype.generate_fallback_key = J(function () {
        var b = X(a._olm_account_generate_fallback_key_random_length)(this.$b),
          c = N(b, g);
        try {
          X(a._olm_account_generate_fallback_key)(this.$b, c, b);
        } finally {
          M(c, b);
        }
      });
      W.prototype.fallback_key = J(function () {
        var b = X(a._olm_account_fallback_key_length)(this.$b),
          c = L(b + 1);
        X(a._olm_account_fallback_key)(this.$b, c, b);
        return y(c, b);
      });
      W.prototype.unpublished_fallback_key = J(function () {
        var b = X(a._olm_account_unpublished_fallback_key_length)(this.$b),
          c = L(b + 1);
        X(a._olm_account_unpublished_fallback_key)(this.$b, c, b);
        return y(c, b);
      });
      W.prototype.forget_old_fallback_key = J(function () {
        X(a._olm_account_forget_old_fallback_key)(this.$b);
      });
      W.prototype.pickle = J(function (b) {
        b = K(b);
        var c = X(a._olm_pickle_account_length)(this.$b),
          d = L(b),
          e = L(c + 1);
        try {
          X(a._olm_pickle_account)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      W.prototype.unpickle = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c);
        try {
          X(a._olm_unpickle_account)(this.$b, d, b.length, e, c.length);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
      });
      function Y() {
        var b = a._olm_session_size();
        this.ac = F(b);
        this.$b = a._olm_session(this.ac);
      }
      function Z(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_session_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      Y.prototype.free = function () {
        a._olm_clear_session(this.$b);
        H(this.$b);
      };
      Y.prototype.pickle = J(function (b) {
        b = K(b);
        var c = Z(a._olm_pickle_session_length)(this.$b),
          d = L(b),
          e = L(c + 1);
        try {
          Z(a._olm_pickle_session)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      Y.prototype.unpickle = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c);
        try {
          Z(a._olm_unpickle_session)(this.$b, d, b.length, e, c.length);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
      });
      Y.prototype.create_outbound = J(function (b, c, d) {
        var e = Z(a._olm_create_outbound_session_random_length)(this.$b),
          f = N(e, g);
        c = K(c);
        d = K(d);
        var k = L(c),
          p = L(d);
        try {
          Z(a._olm_create_outbound_session)(
            this.$b,
            b.$b,
            k,
            c.length,
            p,
            d.length,
            f,
            e,
          );
        } finally {
          M(f, e);
        }
      });
      Y.prototype.create_inbound = J(function (b, c) {
        c = K(c);
        var d = L(c);
        try {
          Z(a._olm_create_inbound_session)(this.$b, b.$b, d, c.length);
        } finally {
          for (M(d, c.length), b = 0; b < c.length; b++) c[b] = 0;
        }
      });
      Y.prototype.create_inbound_from = J(function (b, c, d) {
        c = K(c);
        var e = L(c);
        d = K(d);
        var f = L(d);
        try {
          Z(a._olm_create_inbound_session_from)(
            this.$b,
            b.$b,
            e,
            c.length,
            f,
            d.length,
          );
        } finally {
          for (M(f, d.length), b = 0; b < d.length; b++) d[b] = 0;
        }
      });
      Y.prototype.session_id = J(function () {
        var b = Z(a._olm_session_id_length)(this.$b),
          c = L(b + 1);
        Z(a._olm_session_id)(this.$b, c, b);
        return y(c, b);
      });
      Y.prototype.has_received_message = function () {
        return Z(a._olm_session_has_received_message)(this.$b) ? !0 : !1;
      };
      Y.prototype.matches_inbound = J(function (b) {
        b = K(b);
        var c = L(b);
        return Z(a._olm_matches_inbound_session)(this.$b, c, b.length)
          ? !0
          : !1;
      });
      Y.prototype.matches_inbound_from = J(function (b, c) {
        b = K(b);
        var d = L(b);
        c = K(c);
        var e = L(c);
        return Z(a._olm_matches_inbound_session_from)(
          this.$b,
          d,
          b.length,
          e,
          c.length,
        )
          ? !0
          : !1;
      });
      Y.prototype.encrypt = J(function (b) {
        try {
          var c = Z(a._olm_encrypt_random_length)(this.$b);
          var d = Z(a._olm_encrypt_message_type)(this.$b);
          var e = B(b);
          var f = Z(a._olm_encrypt_message_length)(this.$b, e);
          var k = N(c, g);
          var p = F(e + 1);
          A(b, z, p, e + 1);
          var w = F(f + 1);
          Z(a._olm_encrypt)(this.$b, p, e, k, c, w, f);
          t(w + f);
          return {type: d, body: y(w, f)};
        } finally {
          void 0 !== k && M(k, c),
            void 0 !== p && (M(p, e + 1), H(p)),
            void 0 !== w && H(w);
        }
      });
      Y.prototype.decrypt = J(function (b, c) {
        try {
          var d = F(c.length);
          wa(c, d);
          var e = Z(a._olm_decrypt_max_plaintext_length)(
            this.$b,
            b,
            d,
            c.length,
          );
          wa(c, d);
          var f = F(e + 1);
          var k = Z(a._olm_decrypt)(this.$b, b, d, c.length, f, e);
          t(f + k);
          return y(f, k);
        } finally {
          void 0 !== d && H(d), void 0 !== f && (M(f, e), H(f));
        }
      });
      Y.prototype.describe = J(function () {
        try {
          var b = F(256);
          Z(a._olm_session_describe)(this.$b, b, 256);
          return y(b);
        } finally {
          void 0 !== b && H(b);
        }
      });
      function Ya() {
        var b = a._olm_utility_size();
        this.ac = F(b);
        this.$b = a._olm_utility(this.ac);
      }
      function Za(b) {
        return function () {
          var c = b.apply(this, arguments);
          if (c === h)
            throw (
              ((c = y(a._olm_utility_last_error(arguments[0]))),
              Error('OLM.' + c))
            );
          return c;
        };
      }
      Ya.prototype.free = function () {
        a._olm_clear_utility(this.$b);
        H(this.$b);
      };
      Ya.prototype.sha256 = J(function (b) {
        var c = Za(a._olm_sha256_length)(this.$b);
        b = K(b);
        var d = L(b),
          e = L(c + 1);
        try {
          Za(a._olm_sha256)(this.$b, d, b.length, e, c);
        } finally {
          for (M(d, b.length), d = 0; d < b.length; d++) b[d] = 0;
        }
        return y(e, c);
      });
      Ya.prototype.ed25519_verify = J(function (b, c, d) {
        b = K(b);
        var e = L(b);
        c = K(c);
        var f = L(c);
        d = K(d);
        var k = L(d);
        try {
          Za(a._olm_ed25519_verify)(
            this.$b,
            e,
            b.length,
            f,
            c.length,
            k,
            d.length,
          );
        } finally {
          for (M(f, c.length), b = 0; b < c.length; b++) c[b] = 0;
        }
      });
      olm_exports.Account = W;
      olm_exports.Session = Y;
      olm_exports.Utility = Ya;
      olm_exports.PkEncryption = Va;
      olm_exports.PkDecryption = S;
      olm_exports.PkSigning = Wa;
      olm_exports.SAS = U;
      olm_exports.get_library_version = J(function () {
        var b = L(3);
        a._olm_get_library_version(b, b + 1, b + 2);
        return [sa(b, 'i8'), sa(b + 1, 'i8'), sa(b + 2, 'i8')];
      });

      return Module.ready;
    };
  })();
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = Module;
  else if (typeof define === 'function' && define['amd'])
    define([], function () {
      return Module;
    });
  else if (typeof exports === 'object') exports['Module'] = Module;
  var olmInitPromise;

  olm_exports['init'] = function (opts) {
    if (olmInitPromise) return olmInitPromise;

    if (opts) OLM_OPTIONS = opts;

    olmInitPromise = new Promise(function (resolve, reject) {
      onInitSuccess = function () {
        resolve();
      };
      onInitFail = function (err) {
        reject(err);
      };
      Module();
    });
    return olmInitPromise;
  };

  return olm_exports;
})();

if (typeof window !== 'undefined') {
  // We've been imported directly into a browser. Define the global 'Olm' object.
  // (we do this even if module.exports was defined, because it's useful to have
  // Olm in the global scope for browserified and webpacked apps.)
  window['Olm'] = Olm;
}

if (typeof module === 'object') {
  // Emscripten sets the module exports to be its module
  // with wrapped c functions. Clobber it with our higher
  // level wrapper class.
  module.exports = Olm;
}

// @license-end
