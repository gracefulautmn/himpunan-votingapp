import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppSettingsContext = createContext();

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    login_page_logo_url: '/hmik.jpeg',
    header_logo1_url: '/logo.png',
    header_logo2_url: '/logo2.png',
    login_method: 'campus_email_format',
    election_title: 'Pemilihan Ketua & Wakil Ketua Himpunan',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching app settings:', error);
          // Use default settings if fetch fails
        } else if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Client-side error fetching app settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ ...newSettings, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating app settings:', error);
        throw error;
      }
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Client-side error updating app settings:', err);
      throw err;
    } finally {
      setLoadingSettings(false);
    }
  };


  return (
    <AppSettingsContext.Provider value={{ settings, loadingSettings, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
