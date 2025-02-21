class FileHandler {
    constructor() {
        this.csvData = null;
        this.headers = null;
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const csvText = event.target.result;
                    const results = this.parseCSV(csvText);
                    this.csvData = results.data;  // Store the data
                    this.headers = results.headers;  // Store the headers
                    resolve({ headers: this.headers, data: this.csvData });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        if (lines.length === 0) {
            throw new Error('Empty file');
        }

        // Get headers
        const headers = lines[0].split(',').map(header => header.trim());

        // Parse data
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }

        return { headers, data };
    }

    getData() {
        return this.csvData;
    }

    getHeaders() {
        return this.headers;
    }
}