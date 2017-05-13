//declaring directives
var Directives = {
    text(el, value) {
      el.textContent = value || ''
    },
    show(el, value) {
      el.style.display = value ? '' : 'none'
    },
    on: {
      update(el, handler, event, directive) {
        if (!directive.handlers) {
          directive.handlers = {}
        }
        var handlers = directive.handlers
        if (handlers[event]) {
          el.removeEventListener(event, handlers[event])
        }
        if (handler) {
          handler = handler.bind(el);
          el.addEventListener(event, handler);
          handlers[event] = handler;
        }
      }
    },
    model: {
      bind(el, key, directive, seed) {
        el.addEventListener('keyup', () => seed.$data[key] = el.value);
      },
      update(el, value) {
        el.value = value;
      }
    }
  }
  //difine utils
var Utils = {
  cloneAttributes(attributes) {
    return Array.from(attributes).map(attribute => {
      return {
        name: attribute.name,
        value: attribute.value
      }
    })
  },
  parseDirective(attr) {
    if (!attr.name.includes(prefix)) return;
    var noprefix = attr.name.slice(prefix.length + 1),
      argIndex = noprefix.indexOf(':'),
      dirname = argIndex === -1 ? noprefix : noprefix.slice(0, argIndex),
      def = Directives[dirname],
      arg = argIndex === -1 ? null : noprefix.slice(argIndex + 1);
    var exp = attr.value,
      key = exp.trim();
    return def ? {
      attr: attr,
      key: key,
      definition: def,
      argument: arg,
      update: typeof def === 'function' ? def : def.update,
      bind: typeof def === 'function' ? null : def.bind ? def.bind : null
    } : null;
  }
};
//prefix
var prefix = 'v',
  selector = Object.keys(Directives).map(d => `[${prefix}-${d}]`).join();

class Vue {
  constructor(el, opts = {}) {
    var root = this.$el = document.querySelector(el),
      els = root.querySelectorAll(selector),
      _bindings = {};
    this.$opts = opts;
    this.$data = {}; //export api
    this.processNode(els, _bindings);
    this.initData(_bindings);
  }
}

Object.assign(Vue.prototype, {
  processNode(els, _bindings) {
    els.forEach(el => {
      Utils.cloneAttributes(el.attributes).forEach(attr => {
        var directive = Utils.parseDirective(attr);
        directive && this.bindDirective(el, _bindings, directive)
      });
    });
  },
  bindDirective(el, _bindings, directive) {
    var self = this;
    el.removeAttribute(directive.attr.name);
    var key = directive.key,
      binding = _bindings[key];
    if (!binding) {
      _bindings[key] = binding = {
        value: undefined,
        directives: []
      }
    }
    directive.el = el;
    binding.directives.push(directive);

    if (directive.bind) {
      directive.bind(el, key, directive, self);
    }
    if (!self.$data.hasOwnProperty(key)) {
      self.bind(key, binding);
    }
  },
  bind(key, binding) {
    Object.defineProperty(this.$data, key, {
      set: value => {
        binding.value = value;
        binding.directives.forEach(directive => {
          directive.update(
            directive.el,
            value,
            directive.argument,
            directive,
            this
          )
        })
      },
      get: () => binding.value,
    })
  },
  initData(_bindings) {
    for (let variable in _bindings) {
      this.$data[variable] = this.$opts[variable];
    }
  }
})