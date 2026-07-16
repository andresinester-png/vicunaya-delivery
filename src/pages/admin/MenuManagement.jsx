import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items,      setItems]      = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: rest } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single();
      if (!rest) { setLoading(false); return; }
      setRestaurantId(rest.id);
      const [{ data: cats }, { data: menuItems }] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('restaurant_id', rest.id).order('sort_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', rest.id).order('sort_order'),
      ]);
      setCategories(cats || []);
      setItems(menuItems || []);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  if (!restaurantId) return (
    <div className="card p-10 text-center text-gray-400">
      <p>Tu cuenta no tiene un restaurante asociado.</p>
      <p className="text-sm mt-1">Contactá con el administrador de Kyvra.</p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-extrabold text-2xl">Menú</h1>
        <p className="text-sm text-gray-400 mt-0.5">Vista de solo lectura — la edición está disponible en el panel del restaurante</p>
      </div>

      {categories.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p>Este restaurante aún no tiene categorías en su menú.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category_id === cat.id);
            return (
              <div key={cat.id} className="card p-5">
                <h2 className="font-bold text-lg mb-4">{cat.name}</h2>
                {catItems.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin productos en esta categoría</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                          <p className="text-primary font-bold text-sm">${parseFloat(item.price).toLocaleString('es-AR')}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.is_available ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
