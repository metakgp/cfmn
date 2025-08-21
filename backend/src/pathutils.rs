/// Derived from https://github.com/metakgp/iqps-go

use std::{
    fs,
    path::{self, Path, PathBuf},
};

use url::Url;

#[derive(Clone)]
/// Struct containing all the paths and URLs required to parse or create any note's slug, absolute path, or URL.
pub struct Paths {
    /// URL of the static files server
    static_files_url: Url,
    /// The absolute path to the location from where the static files server serves files
    static_files_path: PathBuf,
    /// The absolute system path to the notes directory on the server
    notes_system_path: PathBuf,
    /// The slug to the notes directory
    notes_path_slug: PathBuf,
    /// The absolute system path to the previews directory on the server
    previews_system_path: PathBuf,
    /// The slug to the previews directory
    previews_path_slug: PathBuf,

    log_location: PathBuf,
}

impl Default for Paths {
    /// Provides a default configuration for local development.
    fn default() -> Self {
        let static_file_storage_location = PathBuf::from("./static_files");
        let notes_path_slug = PathBuf::from("notes/uploaded");
        let previews_path_slug = PathBuf::from("notes/previews");
        let log_location = PathBuf::from("./logs");

        Self {
            static_files_url: Url::parse("http://localhost:3000")
                .expect("Default localhost URL should be valid"),
            static_files_path: static_file_storage_location.clone(),
            notes_system_path: static_file_storage_location.join(&notes_path_slug),
            notes_path_slug,
            previews_system_path: static_file_storage_location.join(&previews_path_slug),
            previews_path_slug,
            log_location,
        }
    }
}


impl Paths {
    /// Creates a new `Paths` struct for notes and previews.
    ///
    /// # Arguments
    /// * `static_files_url` - The static files server URL (e.g., "https://static.metakgp.org").
    /// * `static_file_storage_location` - The absolute path from which static files are served.
    /// * `notes_relative_path` - The path for notes, relative to the static storage location (e.g., "notes/uploaded").
    /// * `previews_relative_path` - The path for previews, relative to the static storage location (e.g., "notes/previews").
    pub fn new(
        static_files_url: &str,
        static_file_storage_location: &Path,
        notes_relative_path: &Path,
        previews_relative_path: &Path,
    ) -> Result<Self, color_eyre::eyre::Error> {
        let static_files_abs_path = path::absolute(static_file_storage_location)?;

        // --- Notes Paths ---
        let notes_path_slug = notes_relative_path.to_owned();
        let notes_system_path = static_files_abs_path.join(&notes_path_slug);
        if !notes_system_path.exists() {
            fs::create_dir_all(&notes_system_path)?;
        }

        // --- Previews Paths ---
        let previews_path_slug = previews_relative_path.to_owned();
        let previews_system_path = static_files_abs_path.join(&previews_path_slug);
        if !previews_system_path.exists() {
            fs::create_dir_all(&previews_system_path)?;
        }

        // --- Log Location ---
        let log_location = static_files_abs_path.join("logs");

        Ok(Self {
            static_files_url: Url::parse(static_files_url)?,
            static_files_path: static_files_abs_path,
            notes_system_path,
            notes_path_slug,
            previews_system_path,
            previews_path_slug,
            log_location,
        })
    }

    // --- Note Functions ---

    pub fn get_note_slug(&self, filename: &str) -> String {
        self.notes_path_slug
            .join(filename)
            .to_string_lossy()
            .to_string()
    }

    pub fn get_note_path(&self, filename: &str) -> PathBuf {
        self.notes_system_path.join(filename)
    }

    pub fn get_note_url(&self, filename: &str) -> Result<String, color_eyre::eyre::Error> {
        let slug = self.get_note_slug(filename);
        self.get_url_from_slug(&slug)
    }

    pub fn get_notes_dir(&self) -> &Path {
        &self.notes_system_path
    }

    // --- Preview Image Functions ---

    pub fn get_preview_slug(&self, filename: &str) -> String {
        self.previews_path_slug
            .join(filename)
            .to_string_lossy()
            .to_string()
    }

    pub fn get_preview_path(&self, filename: &str) -> PathBuf {
        self.previews_system_path.join(filename)
    }

    pub fn get_preview_url(&self, filename: &str) -> Result<String, color_eyre::eyre::Error> {
        let slug = self.get_preview_slug(filename);
        self.get_url_from_slug(&slug)
    }

    pub fn get_previews_dir(&self) -> &Path {
        &self.previews_system_path
    }


    pub fn get_url_from_slug(&self, slug: &str) -> Result<String, color_eyre::eyre::Error> {
        Ok(self.static_files_url.join(slug)?.as_str().to_string())
    }

}