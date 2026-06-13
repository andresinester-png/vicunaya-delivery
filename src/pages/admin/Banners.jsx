import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Image, GripVertical, Upload, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, supabaseAdmin } from '../../lib/supabase.js';

const BUCKET = 'IMAGES';
const EMPTY_BANNER = { image_url: '', title: '', subtitle: '', active: true, sort_order: 0 };

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_BANNER);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('banners').select('*').order('sort_order');
    if (!error) setBanners(data || []);
    setLoading(false);
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    const { data, error } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false });
    if (!error) setLeads(data || []);
    setLeadsLoading(false);
  };

  useEffect(() => { load(); loadLeads(); }, []);

  const openModal = (banner = null) => {
    setForm(banner
      ? { ...banner }
      : { ...EMPTY_BANNER, sort_order: banners.length }
    );
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
      toast.success('Imagen subida');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!form.image_url.trim()) { toast.error('La URL de la imagen es obligatoria'); return; }
    setSaving(true);
    try {
      const payload = {
        image_url: form.image_url.trim(),
        title:     form.title?.trim()    || null,
        subtitle:  form.subtitle?.trim() || null,
        active:    form.active,
        sort_order: Number(form.sort_order) || 0,
      };

      const { error } = form.id
        ? await supabaseAdmin.from('banners').update(payload).eq('id', form.id)
        : await supabaseAdmin.from('banners').insert(payload);
      if (error) throw error;

      toast.success('Banner guardado');
      closeModal();
      load();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm('¿Eliminar este banner?')) return;
    const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);
    if (error) { toast.error('Error: ' + error.message); return; }
    toast.success('Banner eliminado');
    load();
  };

  const toggleActive = async (banner) => {
    const { error } = await supabaseAdmin.from('banners').update({ active: !banner.active }).eq('id', banner.id);
    if (error) { toast.error('Error: ' + error.message); return; }
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-extrabold text-2xl">Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">Carrusel de promociones en Rotiserías</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nuevo banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Image size={44} strokeWidth={1} className="mx-auto mb-3" />
          <p className="font-semibold">No hay banners cargados</p>
          <p className="text-sm mt-1">Se mostrará el carrusel por defecto en Rotiserías.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => (
            <div key={banner.id} className="card p-3 flex items-center gap-3">
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={banner.image_url} alt={banner.title || 'banner'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{banner.title || <span className="text-gray-400 italic">Sin título</span>}</p>
                {banner.subtitle && <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>}
                <p className="text-xs text-gray-400 mt-0.5">Orden: {banner.sort_order}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`w-8 h-5 rounded-full transition-colors relative ${banner.active ? 'bg-green-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${banner.active ? 'translate-x-3' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => openModal(banner)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-bg rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Consultas recibidas ── */}
      <div className="mt-8">
        <h2 className="font-extrabold text-xl mb-1">Consultas recibidas</h2>
        <p className="text-sm text-gray-400 mb-4">Negocios interesados en publicitar en VicuñaYa</p>

        {leadsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Users size={44} strokeWidth={1} className="mx-auto mb-3" />
            <p className="font-semibold">Todavía no hay consultas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <div key={lead.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{lead.nombre} {lead.apellido}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.negocio}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">{lead.telefono}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(lead.created_at).toLocaleDateString('es-AR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{form.id ? 'Editar banner' : 'Nuevo banner'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">URL de la imagen *</label>
                <div className="flex gap-2">
                  <input
                    value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary text-sm font-medium text-gray-600 transition-colors"
                  >
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    Subir imagen
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="rounded-xl overflow-hidden bg-gray-100 h-32 flex items-center justify-center">
                {form.image_url
                  ? <img src={form.image_url} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} onLoad={e => { e.target.style.display = 'block'; }} />
                  : <Image size={28} strokeWidth={1.5} className="text-gray-300" />}
              </div>

              <input
                value={form.title || ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título (opcional)"
                className="input"
              />
              <input
                value={form.subtitle || ''}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Subtítulo (opcional)"
                className="input"
              />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Orden</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="input"
                  min="0"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium">Activo</span>
              </label>

              <button onClick={save} disabled={saving} className="btn-primary w-full">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
