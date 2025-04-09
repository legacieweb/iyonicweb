const Site = require('../models/Site');

exports.createSite = async (req, res) => {
  try {
    const { userId, templateId, price } = req.body;
    const newSite = new Site({ userId, templateId, price });
    await newSite.save();
    res.json(newSite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserSites = async (req, res) => {
  try {
    const { userId } = req.params;
    const sites = await Site.find({ userId });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.renameSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const site = await Site.findByIdAndUpdate(id, { name }, { new: true });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addDomainToSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;
    const site = await Site.findByIdAndUpdate(id, { domain }, { new: true });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
