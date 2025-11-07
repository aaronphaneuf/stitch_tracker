import { useEffect, useState } from "react";
import { createYarn, updateYarn } from "../lib/api";

export default function YarnFormModal({ open, onClose, onSaved, yarn }) {
  const isEdit = Boolean(yarn?.id);

  const [form, setForm] = useState({
    brand: "",
    weight: "",
    colour_name: "",
    colour: "#cccccc",
    amount_per_skein: "",
    material: "",
    product_link: "",
    quantity_owned_skeins: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    if (yarn) {
      setForm({
        brand: yarn.brand || "",
        weight: yarn.weight || "",
        colour_name: yarn.colour_name || "",
        colour: yarn.colour || "#cccccc",
        amount_per_skein: yarn.amount_per_skein || "",
        material: yarn.material || "",
        product_link: yarn.product_link || "",
        quantity_owned_skeins:
          yarn.quantity_owned_skeins === null || yarn.quantity_owned_skeins === undefined
            ? ""
            : String(yarn.quantity_owned_skeins),
      });
    } else {
      setForm({
        brand: "",
        weight: "",
        colour_name: "",
        colour: "#cccccc",
        amount_per_skein: "",
        material: "",
        product_link: "",
        quantity_owned_skeins: "",
      });
    }
    setErr("");
    setSaving(false);
  }, [open, yarn]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    try {
      setSaving(true);
      setErr("");

      const payload = {
        brand: form.brand.trim(),
        weight: form.weight.trim(),
        colour_name: form.colour_name.trim(),
        colour: form.colour.trim(),
        amount_per_skein: form.amount_per_skein.trim(),
        material: form.material.trim(),
        product_link: form.product_link.trim(),
        quantity_owned_skeins:
          form.quantity_owned_skeins === "" ? null : Number(form.quantity_owned_skeins),
      };

      if (isEdit) {
        await updateYarn(yarn.id, payload);
      } else {
        await createYarn(payload);
      }

      onSaved?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Failed to save yarn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">{isEdit ? "Edit Yarn" : "Add Yarn"}</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {err && <div className="alert alert-error mb-2">{err}</div>}

        <div className="grid grid-cols-1 gap-3">
          <label className="form-control">
            <div className="label"><span className="label-text">Brand</span></div>
            <input
              className="input input-bordered"
              value={form.brand}
              onChange={(e) => set({ brand: e.target.value })}
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Weight</span></div>
            <input
              className="input input-bordered"
              value={form.weight}
              onChange={(e) => set({ weight: e.target.value })}
              placeholder="e.g. DK, Worsted, Fingering"
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Color name</span></div>
            <input
              className="input input-bordered"
              value={form.colour_name}
              onChange={(e) => set({ colour_name: e.target.value })}
              placeholder='e.g. "Sky Blue"'
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Hex colour</span></div>
            <div className="flex items-center gap-2">
              <input
                className="input input-bordered w-full"
                value={form.colour}
                onChange={(e) => set({ colour: e.target.value })}
                placeholder="#AABBCC"
              />
              <input
                type="color"
                className="w-10 h-10 p-0 border rounded"
                value={/^#([0-9a-fA-F]{3}){1,2}$/.test(form.colour) ? form.colour : "#cccccc"}
                onChange={(e) => set({ colour: e.target.value })}
                title="Pick colour"
              />
            </div>
            <div className="text-xs opacity-60 mt-1">Use a hex like #AABBCC (or pick with the swatch).</div>
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Amount per skein</span></div>
            <input
              className="input input-bordered"
              value={form.amount_per_skein}
              onChange={(e) => set({ amount_per_skein: e.target.value })}
              placeholder="e.g. 100g / 200m"
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Material</span></div>
            <input
              className="input input-bordered"
              value={form.material}
              onChange={(e) => set({ material: e.target.value })}
              placeholder="e.g. Wool, Cotton"
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Owned (skeins)</span></div>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-bordered"
              value={form.quantity_owned_skeins}
              onChange={(e) => set({ quantity_owned_skeins: e.target.value })}
              placeholder="optional"
            />
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Product link</span></div>
            <input
              className="input input-bordered"
              value={form.product_link}
              onChange={(e) => set({ product_link: e.target.value })}
              placeholder="https://…"
            />
          </label>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn btn-primary ${saving ? "loading" : ""}`}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : (isEdit ? "Save" : "Create")}
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
