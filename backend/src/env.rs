use std::path::PathBuf;
use clap::Parser;
use crate::pathutils::Paths;

#[derive(Parser, Clone)]
#[clap(name = "")]
pub struct EnvVars {
    #[arg(env)]
    pub google_client_id: String,
    #[arg(env)]
    pub signing_secret: String,
    #[arg(env)]
    pub expiration_time_seconds: i64,
    #[arg(env)]
    pub file_size_limit: usize,

    #[arg(env)]
    pub port: u16,

    // Database
    #[arg(env)]
    pub db_name: String,
    #[arg(env)]
    pub db_user: String,
    #[arg(env)]
    pub db_password: String,
    #[arg(env)]
    pub db_host: String,
    #[arg(env)]
    pub db_port: u16,

    // Paths
    #[arg(env, default_value = "https://static.metakgp.org")]
    /// The URL of the static files server (odin's vault)
    static_files_url: String,
    #[arg(env, default_value = "/app/static_files")]
    /// The path where static files are served from
    static_file_storage_location: PathBuf,
    #[arg(env, default_value = "notes/uploaded")]
    /// The path where uploaded notes are stored temporarily, relative to the `static_file_storage_location`
    uploaded_notes_path: PathBuf,
    #[arg(env, default_value = "previews/uploaded")]
    /// The path where uploaded notes are stored temporarily, relative to the `static_file_storage_location`
    previews_path: PathBuf,


    #[arg(env, default_value = "/app/log")]
    /// Location where logs are stored
    pub log_location: PathBuf,

    #[arg(skip)]
    /// All paths must be handled using this
    pub paths: Paths,
}

impl EnvVars {
    /// Processes the environment variables after reading, initializing the Paths struct.
    pub fn process(mut self) -> Result<Self, color_eyre::eyre::Error> {
        self.paths = Paths::new(
            &self.static_files_url,
            &self.static_file_storage_location,
            &self.uploaded_notes_path,
            &self.previews_path,
        )?;

        self.log_location = std::path::absolute(self.log_location)?;

        Ok(self)
    }
}