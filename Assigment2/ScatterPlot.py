import tkinter as tk
import pandas as pd

class ScatterPlot(tk.Canvas):
    # Default constructor (**kwargs is a way to have optional arguments)
    def __init__(self, data, master=None, **kwargs):
        # Call the canvas constructor 
        super().__init__(master, **kwargs)
        self.data = data
        self.plot()

    
    def plot(self):
        # Check if data is available
        if self.data.empty:
            return

        # Define plot area dimensions
        plot_width = self.winfo_reqwidth()
        plot_height = self.winfo_reqheight()
        
        # Define padding for plot area
        padding = 20

        # Calculate scaling factors
        x_min = self.data.iloc[:, 0].min()
        x_max = self.data.iloc[:, 0].max()
        y_min = self.data.iloc[:, 1].min()
        y_max = self.data.iloc[:, 1].max()
        x_scale = (plot_width - 2 * padding) / (x_max - x_min)
        y_scale = (plot_height - 2 * padding) / (y_max - y_min)

      # Plot each data point
        for index, row in self.data.iterrows():
            x = row[0]
            y = row[1]
            x_pixel = padding + (x - x_min) * x_scale
            y_pixel = plot_height - (padding + (y - y_min) * y_scale)
            self.create_oval(x_pixel - 3, y_pixel - 3, x_pixel + 3, y_pixel + 3, fill="blue")
        
        # Draw x and y axes
        self.create_line(padding, plot_height - padding, plot_width - padding, plot_height - padding, fill="black")
        self.create_line(padding, plot_height - padding, padding, padding, fill="black")

# Main
if __name__ == "__main__":
    win = tk.Tk()
    win.title("Scatter Plot")
    win.geometry("850x650")
    
    data = pd.read_csv("data1.csv")

    # Create the canvas
    scatter_plot = ScatterPlot(data, win, width=800, height=600)
    scatter_plot.pack()

    win.mainloop()