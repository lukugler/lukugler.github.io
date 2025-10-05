# Harvesting historical spy imagery by evaluating deep learning models for land cover mapping in Saxony

Remote sensing has played a fundamental role for land cover mapping and change detection at least since the launch of the Landsat satellite program in 1972. In 1995, the Central Intelligence Agency of the United States of America released previously classified spy imagery taken from 1960 onwards with near-global coverage from the Keyhole programme, which includes the **CORONA** satellite mission. CORONA imagery is a treasure because it contains information about land cover 10 years before the beginning of the civilian Earth observation and has a high spatial resolution < 2m. However, this imagery is only pan-chromatic and usually not georeferenced, which has so far prevented a large-scale application for land cover mapping or other geophysical and environmental applications.

Here, we aim to harvest the valuable information about past land cover from CORONA imagery for a state-wide mapping of past land cover changes between **1965 and 1978** by training, testing and validating various deep learning models.

To the best of our knowledge, this is the first work to analyse land cover from CORONA data on a large scale, dividing land cover into **six classes** based on the CORINE classification scheme. The particular focus of the work is to test the **transferability** of the deep learning approaches to unknown CORONA data.

To investigate the transferability, we selected **27** spatially and temporally distributed study areas (each **23 km²**) in the Free State of Saxony (Germany) and created semantic masks to train and test 10 different U-shaped neuronal network architectures to extract land cover from CORONA data. As input, we use either the original panchromatic pixel values and different texture measures. From these input data, ten different training datasets and test datasets were derived for cross-validation.

The training results show that a semantic segmentation of land cover from CORONA data with the used architectures is possible. Strong differences in model performance (based on cross validation and the **Intersection over Union (IoU)** metric) were detected among the classes. Classes with many sample data achieve significantly better IoU values than underrepresented classes. In general, a **U-shaped architecture with a Transformer as Encoder (Transformer U‑Net)** achieved the best results.

- Forests: best IoU **83.29%**
- Agriculture: **74.21%**
- Artificial surfaces: mean IoU **68.83%**
- Water: mean IoU **66.49%**
- Shrub vegetation & open areas: **< 25%**

The deep learning models were successfully transferable in space (between test areas) and time (between CORONA imagery from different years) especially for classes with many sample data. The transferability of deep learning models was difficult for the mapping of water bodies. Despite the general good model performance and successful transferability for most classes, the transferability was limited especially for imagery of very poor quality.

Our approach enabled the state-wide mapping of land cover in **Saxony** between **1965 and 1978** with a spatial resolution of **2 m**. We identify an increase in urban cover and a decrease in cropland cover.

---

**Links**  
- Conference abstract: [EGU23-5487](https://meetingorganizer.copernicus.org/EGU23/EGU23-5487.html)  
- Project report: [publikationen.sachsen.de — Article 42436](https://publikationen.sachsen.de/bdb/artikel/42436)  
- Poster (PDF): [Download / View](../assets/posters/harvesting-corona-poster.pdf)
