export interface BrandConfig {
  identity: {
    app_name: string;
    app_tagline: string;
    app_description: string;
    logo_url: string;
    logo_dark_url: string;
    favicon_url: string;
    icon_512_url: string;
  };
  theme: {
    primary_color: string;
    primary_dark: string;
    accent_color: string;
    font_heading: string;
    font_body: string;
    border_radius: string;
  };
  contact: {
    support_email: string;
    sales_email: string;
    website_url: string;
    twitter_handle: string;
    company_name: string;
    company_address: string;
  };
  legal: {
    copyright_owner: string;
    copyright_year_start: number;
    privacy_policy_url: string;
    terms_url: string;
  };
  seo: {
    default_title: string;
    title_suffix: string;
    default_description: string;
    og_image_url: string;
    twitter_site: string;
    google_analytics_id: string;
    google_tag_manager: string;
  };
  features: {
    show_blog: boolean;
    show_affiliate: boolean;
    maintenance_mode: boolean;
    registration_open: boolean;
  };
}
