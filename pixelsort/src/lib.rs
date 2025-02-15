use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sort(image: Vec<u8>, width: usize, height: usize, level: u16) -> Vec<u8> {
    console_error_panic_hook::set_once();
    let grouped_by_pixel = image
        .chunks(4)
        .map(|x| (x[0], x[1], x[2], x[3]))
        .collect::<Vec<_>>();
    let grouped_by_row = grouped_by_pixel
        .chunks(width)
        .map(|x| x.to_vec())
        .collect::<Vec<_>>();
    let transposed = transpose(grouped_by_row);

    let sorted = transposed
        .iter()
        .map(|row| {
            let mut row_separated = vec![vec![row[0]]];
            for pixel in row.iter().skip(1) {
                let last_section = row_separated.last_mut().unwrap();
                let last_pixel = last_section.last().unwrap();
                let total_diff = u16::from(last_pixel.0.abs_diff(pixel.0))
                    + u16::from(last_pixel.1.abs_diff(pixel.1))
                    + u16::from(last_pixel.2.abs_diff(pixel.2))
                    + u16::from(last_pixel.3.abs_diff(pixel.3));
                if total_diff > level {
                    row_separated.push(vec![*pixel]);
                } else {
                    last_section.push(*pixel);
                }
            }
            for section in row_separated.iter_mut() {
                section.sort_by_key(|x| {
                    -(i16::from(x.0) + i16::from(x.1) + i16::from(x.2) + i16::from(x.3))
                });
            }
            row_separated.iter().flatten().copied().collect::<Vec<_>>()
        })
        .collect::<Vec<_>>();

    let transposed_back = transpose(sorted);

    transposed_back
        .iter()
        .flatten()
        .flat_map(|(r, g, b, a)| vec![*r, *g, *b, *a])
        .collect()
}

fn transpose<T: Copy>(matrix: Vec<Vec<T>>) -> Vec<Vec<T>> {
    let width = matrix.len();
    let height = matrix[0].len();
    let mut transposed = vec![vec![matrix[0][0]; width]; height];
    for (i, row) in matrix.iter().enumerate() {
        for (j, v) in row.iter().enumerate() {
            transposed[j][i] = *v;
        }
    }
    transposed
}
