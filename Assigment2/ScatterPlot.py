import tkinter as tk
import pandas as pd


class ScatterPlot(tk.Canvas):
    def __init__(self, data, master=None, **kwargs):
        super().__init__(master, **kwargs)
        self.data = data
        self.plot()

    def plot(self):
        if self.data.empty:
            return

        width, height = self.winfo_reqwidth(), self.winfo_reqheight()
        padding = 20

        x_min, x_max = self.data.iloc[:, 0].min(), self.data.iloc[:, 0].max()
        y_min, y_max = self.data.iloc[:, 1].min(), self.data.iloc[:, 1].max()

        x_scale = (width - 2 * padding) / (x_max - x_min)
        y_scale = (height - 2 * padding) / (y_max - y_min)

        shape_dict = {
            category: shape
            for category, shape in zip(
                self.data.iloc[:, 2].unique(),
                ["circle", "triangle", "square"],
            )
        }

        for _, row in self.data.iterrows():
            x, y, category = row[0], row[1], row[2]
            x_pixel = padding + (x - x_min) * x_scale
            y_pixel = height - (padding + (y - y_min) * y_scale)
            shape = shape_dict.get(category, "circle")
            self._plot_shape(x_pixel, y_pixel, shape, category)

        self._draw_axes(padding, height, width)
        self._create_legend(width, shape_dict)

    def _plot_shape(self, x, y, shape, category, parent=None):
        parent = parent or self
        if shape == "circle":
            parent.create_oval(x - 3, y - 3, x + 3, y + 3, fill="blue", tags=category)
        elif shape == "triangle":
            self._create_triangle(x, y, category, parent)
        elif shape == "square":
            parent.create_rectangle(
                x - 3, y - 3, x + 3, y + 3, fill="blue", tags=category
            )

    def _create_triangle(self, x, y, category, parent):
        half_width = half_height = 5
        x0, y0 = x, y - half_height
        x1, y1 = x - half_width, y + half_height
        x2, y2 = x + half_width, y + half_height
        parent.create_polygon(x0, y0, x1, y1, x2, y2, fill="blue", tags=category)

    def _draw_axes(self, padding, height, width):
        self.create_line(
            padding, height - padding, width - padding, height - padding, fill="black"
        )
        self.create_line(padding, height - padding, padding, padding, fill="black")

    def _create_legend(self, width, shape_dict):
        legend_frame = tk.Frame(self.master, bg="white", bd=1, relief="solid")
        legend_frame.place(x=width + 15, y=50)

        row = 0
        for category, shape in shape_dict.items():
            legend_label = tk.Label(
                legend_frame,
                text=category,
                font=("Arial", 10, "bold"),
                anchor="w",
                justify="left",
                bg="white",
            )
            legend_label.grid(row=row, column=1, sticky="w", pady=2)

            shape_canvas = tk.Canvas(
                legend_frame,
                width=20,
                height=20,
                bg="white",
                bd=0,
                highlightthickness=0,
            )
            shape_canvas.grid(row=row, column=0, sticky="e", pady=2)
            self._plot_shape(10, 10, shape, "", parent=shape_canvas)

            row += 1


if __name__ == "__main__":
    win = tk.Tk()
    win.title("Scatter Plot")
    win.geometry("850x650")

    data = pd.read_csv("data1.csv")

    scatter_plot = ScatterPlot(data, win, width=800, height=600)
    scatter_plot.pack()

    win.mainloop()
