import math
import tkinter as tk
import pandas as pd
import numpy as np


class ScatterPlot(tk.Canvas):
    def __init__(self, data, master=None, **kwargs):
        super().__init__(master, **kwargs)
        self.data = data
        self.width, self.height = self.winfo_reqwidth(), self.winfo_reqheight()
        self.padding = 70

        self.x_min, self.x_max = self.data.iloc[:, 0].min(), self.data.iloc[:, 0].max()
        self.y_min, self.y_max = self.data.iloc[:, 1].min(), self.data.iloc[:, 1].max()

        self.x_scale = (self.width - 2 * self.padding) / (self.x_max - self.x_min)
        self.y_scale = (self.height - 2 * self.padding) / (self.y_max - self.y_min)

        self.left_selected = None
        self.right_selected = None

        self.plot()

    def plot(self):
        if self.data.empty:
            return

        self._draw_data()
        self._draw_axes()

    def _plot_shape(self, x, y, shape, parent=None):
        parent = parent or self
        if shape == "circle":
            parent.create_oval(x - 3, y - 3, x + 3, y + 3, fill="blue")
        elif shape == "triangle":
            self._create_triangle(x, y, parent)
        elif shape == "square":
            parent.create_rectangle(x - 3, y - 3, x + 3, y + 3, fill="blue")

    def _create_triangle(self, x, y, parent):
        half_width = half_height = 5
        x0, y0 = x, y - half_height
        x1, y1 = x - half_width, y + half_height
        x2, y2 = x + half_width, y + half_height
        parent.create_polygon(x0, y0, x1, y1, x2, y2, fill="blue")

    def _draw_data(self):
        shape_dict = {
            category: shape
            for category, shape in zip(
                self.data.iloc[:, 2].unique(),
                ["circle", "triangle", "square"],
            )
        }

        for _, row in self.data.iterrows():
            x, y, category = row[0], row[1], row[2]
            x_pixel = self.padding + (x - self.x_min) * self.x_scale
            y_pixel = self.height - (self.padding + (y - self.y_min) * self.y_scale)
            shape = shape_dict.get(category, "circle")
            self._plot_shape(x_pixel, y_pixel, shape)
        self._create_legend(self.width, shape_dict)

    def _draw_axes(self):
        # Adjust the placement of x and y axes based on the values in the data
        origin_x = self.padding + (0 - self.x_min) * self.x_scale
        origin_y = self.height - self.padding - (0 - self.y_min) * self.y_scale

        # Check the ranges of x and y values and adjust the axes accordingly
        if self.x_min <= 0 <= self.x_max:
            y_axis_x_pos = origin_x
        elif self.x_min >= 0:
            y_axis_x_pos = self.padding
        else:  # x_max <= 0
            y_axis_x_pos = self.width - self.padding

        if self.y_min <= 0 <= self.y_max:
            x_axis_y_pos = origin_y
        elif self.y_min >= 0:
            x_axis_y_pos = self.height - self.padding
        else:  # y_max <= 0
            x_axis_y_pos = self.padding

        # Draw x and y axes based on adjusted positions
        self.create_line(
            self.padding,
            x_axis_y_pos,
            self.width - self.padding,
            x_axis_y_pos,
            fill="black",
        )
        self.create_line(
            y_axis_x_pos,
            self.height - self.padding,
            y_axis_x_pos,
            self.padding,
            fill="black",
        )

        nr_of_ticks = 6

        self._draw_tick_values(nr_of_ticks, x_axis_y_pos, y_axis_x_pos)

    def _draw_tick(self, x, y, value, horizontal=False):
        tick_length = 5
        tick_width = 2

        if horizontal:
            self.create_line(x, y, x, y + tick_length, fill="black", width=tick_width)
            self.create_text(x, y + tick_length + 5, text=value, anchor="n")
        else:
            self.create_line(x, y, x - tick_length, y, fill="black", width=tick_width)
            self.create_text(x - tick_length - 5, y, text=value, anchor="e")

    def _draw_tick_values(self, nr_of_ticks, x_axis_y_pos, y_axis_x_pos):
        x_ticks = np.linspace(self.x_min, self.x_max, nr_of_ticks)
        y_ticks = np.linspace(self.y_min, self.y_max, nr_of_ticks)

        x_pixels = [self.padding + (x - self.x_min) * self.x_scale for x in x_ticks]
        y_pixels = [
            self.height - (self.padding + (y - self.y_min) * self.y_scale)
            for y in y_ticks
        ]

        for x, value in zip(x_pixels, x_ticks):
            value = round(value, 2)  # Round to two decimal points
            self._draw_tick(x, x_axis_y_pos, value, horizontal=True)
        for y, value in zip(y_pixels, y_ticks):
            value = round(value, 2)  # Round to two decimal points
            self._draw_tick(y_axis_x_pos, y, value, horizontal=False)

    def _create_legend(self, width, shape_dict):
        legend_frame = tk.Frame(self.master, bg="white", bd=1, relief="solid")
        legend_frame.place(x=width - 10, y=50)

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
            self._plot_shape(10, 10, shape, parent=shape_canvas)

            row += 1

    def _point_clicked(self, event):
        x, y = event.x, event.y

        for item in self.find_overlapping(x - 1, y - 1, x + 1, y + 1):
            if item:
                if event.num == 1:  # Left-click
                    self._left_click(item)
                    break
                elif event.num == 3:  # Right-click
                    self._right_click(x, y)
                    break

    def _left_click(self, item):
        print("vänster")

    def _right_click(self, x, y):
        clicked_point = self._get_data_point(x, y)

        # Select new point - no point is currently selected
        if self.right_selected is None:
            self.right_selected = clicked_point
            neighbors = self._find_neighbors(clicked_point, num_neighbors=5)
            self._highlight_points(neighbors)
        else:
            # Remove selection - unhighlight the points
            if clicked_point == self.right_selected:
                self._unhighlight_points()
                self.right_selected = None

            # Select new point - a point is already currently selected
            else:
                self._unhighlight_points()
                self.right_selected = clicked_point
                neighbors = self._find_neighbors(clicked_point, num_neighbors=5)
                self._highlight_points(neighbors)

    def _get_data_point(self, x, y):
        # Convert pixel coordinates to data coordinates
        x_data = (x - self.padding) / self.x_scale + self.x_min
        y_data = (self.height - y - self.padding) / self.y_scale + self.y_min
        return (round(x_data), round(y_data))

    def _calculate_distance(self, point1, point2):
        return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)

    def _find_neighbors(self, center_point, num_neighbors=5):
        distances = [
            (self._calculate_distance(center_point, (row[0], row[1])), (row[0], row[1]))
            for _, row in self.data.iterrows()
        ]
        distances.sort()  # Sort by distance
        neighbors = [point[1] for point in distances[:num_neighbors]]
        return neighbors

    def _highlight_points(self, points):
        for point in points:
            x_pixel = self.padding + (point[0] - self.x_min) * self.x_scale
            y_pixel = self.height - (
                self.padding + (point[1] - self.y_min) * self.y_scale
            )
            oval_id = self.create_oval(
                x_pixel - 7,
                y_pixel - 7,
                x_pixel + 7,
                y_pixel + 7,
                outline="red",
                width=2,
            )
            self.addtag_withtag("highlight", oval_id)

    def _unhighlight_points(self):
        # Remove all highlighted points
        highlighted_points = self.find_withtag("highlight")
        for item in highlighted_points:
            self.delete(item)


if __name__ == "__main__":
    # Create the window
    win = tk.Tk()
    win.title("Scatter Plot")
    win.geometry("850x650")

    data = pd.read_csv("data1.csv")

    scatter_plot = ScatterPlot(data, win, width=800, height=600)
    scatter_plot.pack()

    # Bind the click events to the _point_clicked method
    scatter_plot.bind("<Button-1>", scatter_plot._point_clicked)  # Left-click
    scatter_plot.bind("<Button-3>", scatter_plot._point_clicked)  # Right-click

    win.mainloop()
