package in.gov.cmpdi.dams.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    @Profile("prod")
    public DataSource dataSource() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getenv("POSTGRES_URL");
        }

        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.trim().isEmpty()) {
            username = System.getenv("DATABASE_USERNAME");
        }
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
        if (password == null || password.trim().isEmpty()) {
            password = System.getenv("DATABASE_PASSWORD");
        }

        // Local default fallback
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            log.info("No cloud database URL found in environment, falling back to local PostgreSQL (localhost:5432/cmpdi_dams)");
            dbUrl = "jdbc:postgresql://localhost:5432/cmpdi_dams";
            if (username == null) username = "postgres";
            if (password == null) password = "Sujal@123";
        }

        // Render & Heroku DATABASE_URL conversion:
        // Render format: postgres://user:pass@host:port/dbname or postgresql://user:pass@host:port/dbname
        if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
            try {
                log.info("Parsing cloud PostgreSQL URI format for Render...");
                URI dbUri = new URI(dbUrl);
                if (dbUri.getUserInfo() != null) {
                    String[] userInfo = dbUri.getUserInfo().split(":");
                    username = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }
                int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
                String host = dbUri.getHost();
                String path = dbUri.getPath();
                dbUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (!dbUrl.contains("sslmode")) {
                    dbUrl += "?sslmode=require";
                }
                log.info("Successfully converted cloud Database URL to JDBC format: {}", dbUrl);
            } catch (URISyntaxException e) {
                log.warn("Failed to parse DB URI via URI parser, performing string replacement fallback: {}", e.getMessage());
                dbUrl = dbUrl.replace("postgres://", "jdbc:postgresql://")
                             .replace("postgresql://", "jdbc:postgresql://");
            }
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(dbUrl)
                .username(username)
                .password(password)
                .build();
    }
}
