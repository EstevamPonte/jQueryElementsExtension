function extractJQueryEvents() {
  if (!window.jQuery || !$0) return {};

  const results = { __proto__: null };
  const path = [document];
  let el = $0;

  while (el) {
    path.push(el);
    el = el.parentElement;
  }

  for (let i = 0; i < path.length; i++) {
    const elem = path[i];
    const tag = elem.nodeName ? elem.nodeName.toLowerCase() : "unknown";
    const id = elem.id ? `#${elem.id}` : "";
    const classes = elem.classList && elem.classList.length ? "." + Array.from(elem.classList).join(".") : "";
    const origin = `${tag}${id}${classes}`;
    const events = jQuery._data(elem, "events") || {};

    for (let type in events) {
      events[type].forEach(handler => {
        let applies = false;
        if (handler.selector) {
          try {
            applies = jQuery($0).is(handler.selector);
          } catch (e) {}
        } else if (elem === $0) {
          applies = true;
        }

        if (applies) {
          const entry = {
            type,
            delegated: !!handler.selector,
            selector: handler.selector || null,
            handler: handler.handler.toString(),
            from: origin,
            namespace: handler.namespace || null,
            data: handler.data || null
          };

          if (!results[type]) results[type] = [];
          results[type].push(entry);
        }
      });
    }
  }

  return results;
}

function updatePanel() {
  chrome.devtools.inspectedWindow.eval(
    "(" + extractJQueryEvents.toString() + ")()",
    (result, isException) => {
      const container = document.getElementById("eventList");
      container.innerHTML = "";

      if (isException || !result || Object.keys(result).length === 0) {
        container.innerText = "None jQuery event found.";
        return;
      }

      for (let type in result) {
        const group = document.createElement("div");
        group.className = "event-group";

        const header = document.createElement("div");
        header.className = "event-header";
        header.innerText = type;

        group.appendChild(header);

        result[type].forEach(ev => {
          const item = document.createElement("div");
          item.className = "event-item";

          const info = document.createElement("div");
          info.innerText = `Delegate: ${ev.delegated} | From: ${ev.from}${ev.selector ? " | Selector: " + ev.selector : ""}`;
          item.appendChild(info);

          const code = document.createElement("div");
          code.className = "handler-code";
          code.innerText = ev.handler;
          item.appendChild(code);

          if (ev.handler.length > 200) {
            const expand = document.createElement("div");
            expand.className = "expand-btn";
            expand.innerText = "Show more...";
            expand.onclick = () => {
              code.style.maxHeight = "none";
              expand.remove();
            };
            item.appendChild(expand);
          }

          group.appendChild(item);
        });

        container.appendChild(group);
      }
    }
  );
}

// Atualiza ao iniciar e ao trocar a seleção
updatePanel();
chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);
