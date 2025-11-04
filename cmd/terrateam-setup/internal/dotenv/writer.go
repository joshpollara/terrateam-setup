package dotenv

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

// Writer handles writing environment variables to .env file
type Writer struct {
	path string
	vars map[string]string
}

// New creates a new dotenv writer
func New() *Writer {
	cwd, _ := os.Getwd()
	return &Writer{
		path: filepath.Join(cwd, ".env"),
		vars: make(map[string]string),
	}
}

// Set sets a key-value pair
func (w *Writer) Set(key, value string) {
	w.vars[key] = value
}

// Write writes all variables to the .env file
func (w *Writer) Write() error {
	// Load existing .env if it exists
	existing, _ := godotenv.Read(w.path)
	if existing == nil {
		existing = make(map[string]string)
	}

	// Merge with new values (new values override)
	for k, v := range w.vars {
		existing[k] = v
	}

	// Write back to file
	return godotenv.Write(existing, w.path)
}

// Display shows the .env file contents (for user review)
func (w *Writer) Display() error {
	content, err := os.ReadFile(w.path)
	if err != nil {
		return err
	}

	fmt.Println("\n📄 Generated .env file:")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	lines := strings.Split(string(content), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		// Mask sensitive values
		if strings.Contains(line, "SECRET") || strings.Contains(line, "TOKEN") || strings.Contains(line, "PEM") {
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				fmt.Printf("%s=%s...\n", parts[0], parts[1][:min(20, len(parts[1]))])
				continue
			}
		}
		fmt.Println(line)
	}
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("\n✓ Configuration saved to: %s\n", w.path)
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
